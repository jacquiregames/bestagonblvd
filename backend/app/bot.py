# backend/app/bot.py
"""
Computer opponent ("bot") AI.

Design goal: a "decent" bot, not a random-move bot. The key idea is that we
never hand-roll a second, approximate copy of the game's rules to guess what
a move is worth — we run the *real* rule engine (engine.apply_action) against
a scratch copy of the actual GameState for every candidate move, and read off
the real resulting money/income/reputation/population. That means tile
synergies, red-line crossings, market-fee costs, upkeep, and even
end-of-game scoring are all taken into account exactly, for free, with zero
risk of the bot's understanding of the rules drifting out of sync with the
real engine.

On top of that exact "what would happen" simulation, we layer a modest,
clearly-labelled heuristic for the things simulation *can't* tell us on its
own: how much a recurring income/reputation gain is worth over the rest of
the game, and how much progress towards a goal is worth given how close the
bot already is to winning it.

Nothing in this file mutates the real GAME_STATE — every function here
either reads it or works against a throwaway deep copy. The orchestration
that decides *when* to call these functions (whose turn is it, is a bot
awaiting a discard, etc.) lives in main.py, since that's where the real
game_state_lock / TURN_SNAPSHOTS / broadcasting already live.
"""
import asyncio
import logging
import random
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException

from .data.tiles import get_all_tiles
from .data.goals import GOALS
from .engine import apply_action
from .game_constants import MARKET_COST_MODIFIERS, OFF_BOARD_CELLS
from .goal_evaluator import calculate_player_stats_for_goals, get_stat_value
from .models import GameState, GoalConditionType, PlacedTile
from .schemas import (
    ActionRequest,
    CreateLakeAction,
    DiscardMarketTileAction,
    PlaceBasicTileAction,
    PlaceInvestmentAction,
    PlaceTileAction,
    SelectPrivateGoalAction,
)
from .utils import get_neighbors

ALL_TILES = get_all_tiles()

# --- Bot identity -----------------------------------------------------------

# Kept short (emoji + <=3 letters) so they survive the 5-character name
# truncation used in a few tight UI spots (e.g. PlayersDisplay) without
# losing the "this is a bot" signal, since it's baked right into the name.
BOT_NAMES = ["🤖N00b", "🤖Beep", "🤖Claude", "🤖Ninja", "🤖ShyGuy", "🤖Bender", "🤖Boop", "🤖H4X0R", "🤖Pwnage", "🤖Suburbia"]
BOT_COLORS = ['black', 'blue', 'cyan', 'green', 'grey', 'orange', 'purple', 'red', 'white', 'yellow']


def make_bot_name(existing_names: List[str]) -> str:
    available = [n for n in BOT_NAMES if n not in existing_names]
    if available:
        return random.choice(available)
    i = 1
    while f"🤖Bot{i}" in existing_names:
        i += 1
    return f"🤖Bot{i}"


def make_bot_color(existing_colors: List[str]) -> Optional[str]:
    available = [c for c in BOT_COLORS if c not in existing_colors]
    if not available:
        return None
    return random.choice(available)


# --- Scoring weights ---------------------------------------------------------
# Population is the actual win condition, so it anchors everything else:
#   - Money converts to population 1-for-5 at game end (and buys future
#     tiles), so it's worth a fraction of a population point right now.
#   - Reputation is added directly to population every one of the bot's own
#     upkeep phases, so — over the turns the bot has left — it's worth
#     roughly as much as population itself, per turn.
#   - Income converts to money every one of the bot's own upkeep phases, so
#     it's worth roughly what money is worth, per turn.
POP_WEIGHT = 1.0
MONEY_WEIGHT = 0.3
INCOME_WEIGHT = 0.3
REPUTATION_WEIGHT = 1.0
GOAL_WEIGHT_BASE = 0.8

MAX_FRONTIER_CELLS = 40  # sanity cap; real Suburbia boards don't get this wide


# --- Board/geometry helpers ---------------------------------------------------

def _frontier_cells(board: List[PlacedTile]) -> List[Tuple[int, int]]:
    """Every empty cell adjacent to at least one existing tile — i.e. every
    legal placement spot, matching utils.validate_placement's rule exactly."""
    if not board:
        return [(0, 0)]
    occupied = {(t.q, t.r) for t in board}
    frontier = set()
    for t in board:
        for n in get_neighbors(t.q, t.r):
            if n not in occupied and n not in OFF_BOARD_CELLS:
                frontier.add(n)
    cells = list(frontier)
    if len(cells) > MAX_FRONTIER_CELLS:
        cells = random.sample(cells, MAX_FRONTIER_CELLS)
    return cells


def _estimate_turns_remaining(game_state: GameState, player_name: str) -> int:
    """Roughly how many more times this specific player will get to act —
    used to weigh recurring income/reputation against one-off money/population."""
    num_players = max(1, len(game_state.turn_order) or len(game_state.players) or 1)
    if game_state.final_turn_countdown is not None:
        return max(1, game_state.final_turn_countdown // num_players)
    remaining_tiles = len(game_state.tile_stack_abc) + sum(1 for t in game_state.real_estate_market if t)
    return max(3, remaining_tiles // num_players)


def _make_scratch_state(game_state: GameState) -> GameState:
    """
    Deep-copies `game_state` for simulation, skipping the ever-growing
    turn_history log (and last_turn_summary). The engine only appends to
    that log and never reads it to make rule decisions, so copying it in
    full for every single candidate move the bot considers would get slower
    and slower as a game goes on, for no benefit at all.
    """
    real_history = game_state.turn_history
    real_last_summary = game_state.last_turn_summary
    game_state.turn_history = []
    game_state.last_turn_summary = None
    try:
        scratch = game_state.model_copy(deep=True)
    finally:
        game_state.turn_history = real_history
        game_state.last_turn_summary = real_last_summary
    return scratch


# --- Discard choice (used both for real discards and inside simulation) -----

def _tile_static_value(tile_id: str) -> float:
    """
    A cheap, non-simulated "would I generally want this tile" estimate, used
    only to compare *discard* options against each other. Real placement
    candidates get the full simulated treatment in choose_main_action — this
    is deliberately simpler since the bot only needs a rough ranking of "a
    market slot's tile" vs. "another market slot's tile", not an exact value.
    """
    tile_data = ALL_TILES.get(tile_id)
    if not tile_data:
        return 0.0
    value = 0.0
    value += tile_data.incomeChange * 1.5
    value += tile_data.reputationChange * 1.2
    value += tile_data.populationChange * 1.0
    value += 0.5 * len(tile_data.effects)  # tiles with more effects tend to be more useful
    return value


def _best_discard_index(game_state: GameState, player_name: str) -> int:
    player = game_state.players[player_name]
    market = game_state.real_estate_market

    best_index = None
    best_score = None
    for i, tile_id in enumerate(market):
        if tile_id is None:
            continue
        fee = MARKET_COST_MODIFIERS[i] if i < len(MARKET_COST_MODIFIERS) else 0
        if player.money < fee:
            continue
        # Cheaper fees and tiles we don't want anyway make a better discard.
        score = -fee - _tile_static_value(tile_id)
        if best_score is None or score > best_score:
            best_score = score
            best_index = i

    if best_index is None:
        # Shouldn't happen — slots 0/1 are always free — but never crash.
        best_index = next((i for i, t in enumerate(market) if t is not None), 0)
    return best_index


def choose_discard_action(game_state: GameState, player_name: str) -> DiscardMarketTileAction:
    index = _best_discard_index(game_state, player_name)
    return DiscardMarketTileAction(player_name=player_name, type="DISCARD_MARKET_TILE", market_index=index)


# --- Goal-progress heuristic --------------------------------------------------

def _goal_progress_bonus(original: GameState, scratch: GameState, player_name: str) -> float:
    player = original.players[player_name]
    goal_ids = list(scratch.public_goals)
    if player.private_goal:
        goal_ids.append(player.private_goal)

    bonus = 0.0
    for goal_id in goal_ids:
        goal = GOALS.get(goal_id)
        if not goal or not goal.condition or not goal.condition.target:
            continue
        target = goal.condition.target

        before_val = get_stat_value(
            calculate_player_stats_for_goals(
                player_name, original.players[player_name],
                original.player_boards.get(player_name, []), original.player_boards,
            ),
            target,
        )
        after_val = get_stat_value(
            calculate_player_stats_for_goals(
                player_name, scratch.players[player_name],
                scratch.player_boards.get(player_name, []), scratch.player_boards,
            ),
            target,
        )
        improvement = after_val - before_val
        if improvement == 0:
            continue

        other_vals = [
            get_stat_value(
                calculate_player_stats_for_goals(pid, p, original.player_boards.get(pid, []), original.player_boards),
                target,
            )
            for pid, p in original.players.items() if pid != player_name
        ]
        best_other = max(other_vals) if other_vals else 0

        weight = GOAL_WEIGHT_BASE * (goal.populationBonus / 6.0)

        took_the_lead = (
            goal.condition.type == GoalConditionType.MOST
            and after_val > best_other
            and before_val <= best_other
        )
        if took_the_lead:
            weight *= 3.0  # actually taking the lead matters a lot more than incremental progress

        bonus += improvement * weight

    return bonus


# --- Candidate generation + scoring -------------------------------------------

def _generate_candidates(game_state: GameState, player_name: str) -> List[ActionRequest]:
    player = game_state.players[player_name]
    board = game_state.player_boards.get(player_name, [])
    frontier = _frontier_cells(board)
    candidates: List[ActionRequest] = []

    # PLACE_TILE — buy a tile from the real-estate market
    for idx, tile_id in enumerate(game_state.real_estate_market):
        if not tile_id:
            continue
        tile_data = ALL_TILES.get(tile_id)
        if not tile_data:
            continue
        fee = MARKET_COST_MODIFIERS[idx] if idx < len(MARKET_COST_MODIFIERS) else 0
        total_cost = tile_data.cost + fee
        if player.money < total_cost:
            continue
        for (q, r) in frontier:
            candidates.append(PlaceTileAction(
                player_name=player_name, type="PLACE_TILE",
                tile_id=tile_id, q=q, r=r, market_index=idx,
            ))

    # CREATE_LAKE — sacrifice a market slot's tile for a lake instead
    for idx, tile_id in enumerate(game_state.real_estate_market):
        if not tile_id:
            continue
        fee = MARKET_COST_MODIFIERS[idx] if idx < len(MARKET_COST_MODIFIERS) else 0
        if player.money < fee:
            continue
        for (q, r) in frontier:
            candidates.append(CreateLakeAction(
                player_name=player_name, type="CREATE_LAKE",
                market_index=idx, q=q, r=r,
            ))

    # PLACE_BASIC_TILE
    for tile_id in game_state.basic_tiles:
        if game_state.basic_tile_quantities.get(tile_id, 0) <= 0:
            continue
        tile_data = ALL_TILES.get(tile_id)
        if not tile_data or player.money < tile_data.cost:
            continue
        for (q, r) in frontier:
            candidates.append(PlaceBasicTileAction(
                player_name=player_name, type="PLACE_BASIC_TILE",
                tile_id=tile_id, q=q, r=r,
            ))

    # PLACE_INVESTMENT_MARKER — double an existing tile's ongoing effects
    if player.investment_markers > 0:
        for t in board:
            if t.has_investment:
                continue
            if t.is_lake:
                cost = 0
            else:
                tile_data = ALL_TILES.get(t.tile_id)
                cost = tile_data.cost if tile_data else None
            if cost is None or player.money < cost:
                continue
            candidates.append(PlaceInvestmentAction(
                player_name=player_name, type="PLACE_INVESTMENT_MARKER",
                q=t.q, r=t.r,
            ))

    return candidates


def _simulate_and_score(game_state: GameState, action: ActionRequest, player_name: str) -> Optional[float]:
    """
    Applies `action` (and, if it requires one, the bot's chosen discard) to a
    scratch copy of `game_state` using the real engine, then scores the
    resulting state. Returns None if the action turns out not to be legal
    after all (shouldn't normally happen since candidates are pre-filtered,
    but simulation state can shift subtly turn to turn, so we guard it).
    """
    scratch = _make_scratch_state(game_state)
    try:
        apply_action(scratch, action, turn_snapshots=None)
    except HTTPException:
        return None
    except Exception:
        logging.exception("Bot simulation raised unexpectedly for action %r", action)
        return None

    if scratch.player_awaiting_discard == player_name:
        try:
            discard_index = _best_discard_index(scratch, player_name)
            discard_action = DiscardMarketTileAction(
                player_name=player_name, type="DISCARD_MARKET_TILE", market_index=discard_index,
            )
            apply_action(scratch, discard_action, turn_snapshots=None)
        except HTTPException:
            return None
        except Exception:
            logging.exception("Bot simulation raised unexpectedly during discard for %r", action)
            return None

    return _score_resulting_state(game_state, scratch, player_name)


def _score_resulting_state(original: GameState, scratch: GameState, player_name: str) -> float:
    orig_player = original.players[player_name]
    new_player = scratch.players[player_name]

    d_money = new_player.money - orig_player.money
    d_income = new_player.income - orig_player.income
    d_reputation = new_player.reputation - orig_player.reputation
    d_population = new_player.population - orig_player.population

    turns_left = _estimate_turns_remaining(scratch, player_name)

    score = (
        d_population * POP_WEIGHT
        + d_money * MONEY_WEIGHT
        + d_income * INCOME_WEIGHT * turns_left
        + d_reputation * REPUTATION_WEIGHT * turns_left
    )

    if new_player.income < 0:
        # A linear income weight isn't enough on its own: once money runs
        # out, unpaid upkeep debt is converted directly into lost
        # population every turn (see apply_upkeep_and_recalculate's
        # "Bankrupt: paid debt with population" path) — a compounding,
        # self-destructive spiral that a purely one-turn-ahead score would
        # otherwise walk right into by greedily grabbing cheap population
        # (e.g. lakes) at the cost of crossing several red lines at once.
        # Scale the penalty by how exposed the player actually is: if their
        # money buffer comfortably covers the debt for the turns they have
        # left, a dip in income is a normal, fine trade-off and barely
        # penalized; if the buffer is thin, it gets punished hard.
        turns_of_debt_covered = new_player.money / max(1, abs(new_player.income))
        exposure = max(0.0, 1 - (turns_of_debt_covered / max(1, turns_left)))
        score -= (new_player.income ** 2) * 0.2 * exposure * turns_left

    score += _goal_progress_bonus(original, scratch, player_name)
    score += random.uniform(-0.05, 0.05)  # tie-breaking jitter so ties don't always resolve the same way
    return score


async def choose_main_action(game_state: GameState, player_name: str) -> Optional[ActionRequest]:
    """
    The bot's core decision: try every legal candidate move (place a market
    tile, place a basic tile, create a lake, or place an investment marker,
    at every legal board position), simulate each one for real, and take the
    highest-scoring result. Returns None if there are no legal candidates at
    all (e.g. the bot can't afford anything) — the caller falls back to
    choose_fallback_action in that case.
    """
    candidates = _generate_candidates(game_state, player_name)
    if not candidates:
        return None

    best_action: Optional[ActionRequest] = None
    best_score: Optional[float] = None
    for action in candidates:
        await asyncio.sleep(0)
        score = _simulate_and_score(game_state, action, player_name)
        if score is None:
            continue
        if best_score is None or score > best_score:
            best_score = score
            best_action = action

    return best_action


def choose_fallback_action(game_state: GameState, player_name: str) -> Optional[ActionRequest]:
    """
    A dead-simple, always-legal-if-affordable fallback used only if
    choose_main_action() raises or comes back empty (e.g. a bug in the
    heuristic). Buys the cheapest affordable basic tile on the first
    available frontier cell. Returns None only if the bot truly can't
    afford anything — a pre-existing edge case that could in principle also
    strand a human player, not something specific to bots.
    """
    player = game_state.players.get(player_name)
    if not player:
        return None
    board = game_state.player_boards.get(player_name, [])
    frontier = _frontier_cells(board)
    if not frontier:
        return None

    affordable = [
        tile_id for tile_id in game_state.basic_tiles
        if game_state.basic_tile_quantities.get(tile_id, 0) > 0
        and ALL_TILES.get(tile_id)
        and player.money >= ALL_TILES[tile_id].cost
    ]
    if not affordable:
        return None
    affordable.sort(key=lambda t: ALL_TILES[t].cost)
    tile_id = affordable[0]
    q, r = frontier[0]
    return PlaceBasicTileAction(player_name=player_name, type="PLACE_BASIC_TILE", tile_id=tile_id, q=q, r=r)


# --- Private goal selection ---------------------------------------------------

def choose_goal_selection_action(game_state: GameState, player_name: str) -> SelectPrivateGoalAction:
    player = game_state.players[player_name]
    options = player.private_goal_options

    def option_value(goal_id: str) -> float:
        goal = GOALS.get(goal_id)
        if not goal:
            return 0.0
        value = float(goal.populationBonus)
        # AT_LEAST/EXACTLY goals only depend on the bot's own board, rather
        # than racing the table for "most"/"fewest" of something — generally
        # a bit more reliably achievable, so nudge them up slightly.
        if goal.condition and goal.condition.type in (GoalConditionType.AT_LEAST, GoalConditionType.EXACTLY):
            value *= 1.15
        value += random.uniform(-0.5, 0.5)
        return value

    if not options:
        # Shouldn't happen, but never let this crash the bot loop.
        return SelectPrivateGoalAction(player_name=player_name, type="SELECT_PRIVATE_GOAL", goal_id="")

    chosen = max(options, key=option_value)
    return SelectPrivateGoalAction(player_name=player_name, type="SELECT_PRIVATE_GOAL", goal_id=chosen)


# --- Undo votes ----------------------------------------------------------------

def choose_undo_vote(game_state: GameState, player_name: str) -> str:
    """
    Bots always approve undo requests. Weighing "how much would rejecting
    this help me" is a lot of added complexity for a low-stakes, casual-play
    mechanic, and a bot that can never be convinced to approve an undo is a
    much worse table-mate than one that's slightly too generous with them.
    """
    return "approve"

