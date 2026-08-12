# backend/app/game_rules.py
import logging
from typing import List, Dict, Tuple, Optional, Any
from enum import Enum
from .models import PlacedTile, TileEffect, EffectTrigger, StatChangeDetail, TurnSummary, TileCategory, GameState, Player
from .data.tiles import get_all_tiles
# Import canonical helpers from utils — no duplicates here
from .utils import get_neighbors, calculate_adjacency_bonus, hex_distance, _matches_target
from .goal_evaluator import calculate_player_stats_for_goals, evaluate_public_goals, player_achieved_private_goal
from .game_constants import MIN_INCOME_REPUTATION, MAX_INCOME_REPUTATION, RED_LINES, MAX_INVESTMENT_MARKERS, MARKET_COST_MODIFIERS, MAX_POPULATION, LAKE_ADJACENCY_BONUS

ALL_TILES = get_all_tiles()

BASIC_TILE_QUANTITIES = {
    "COMMUNITY_PARK": 0,
    "HEAVY_FACTORY": 0,
    "SUBURBS": 0,
}

def initialize_basic_tiles(num_players: int) -> Dict[str, int]:
    return {
        'COMMUNITY_PARK': 4,
        'HEAVY_FACTORY': 4,
        'SUBURBS': 4,
    }

def calculate_action_delta(game_state: GameState, player_name: str, tile_coords: Tuple[int, int], action_type: str) -> Dict[str, List[StatChangeDetail]]:
    all_player_deltas = {}
    boards_map = game_state.player_boards

    q, r = tile_coords
    active_board = boards_map.get(player_name, [])
    newly_placed_pt = next((t for t in active_board if t.q == q and t.r == r), None)
    if not newly_placed_pt: return {}

    new_tile_info = ALL_TILES.get(newly_placed_pt.tile_id) if not newly_placed_pt.is_lake else None

    # --- Part 1: How existing tiles react TO the new tile ---
    # Investing does not count as placing a new tile, so existing tiles do not react to it.
    if action_type != "PLACE_INVESTMENT_MARKER":
        for owner_name, board in boards_map.items():
            changes = []
            for existing_pt in board:
                if (owner_name == player_name and (existing_pt.q, existing_pt.r) == (q, r)) or existing_pt.is_lake:
                    continue

                info = ALL_TILES.get(existing_pt.tile_id)
                if not info: continue

                mul = 2 if existing_pt.has_investment else 1
                for eff in info.effects:
                    target_to_match = newly_placed_pt if newly_placed_pt.is_lake else new_tile_info
                    if not target_to_match or not _matches_target(target_to_match, eff.target):
                        continue

                    triggered = False
                    if eff.trigger == EffectTrigger.ADJACENT:
                        if owner_name == player_name and hex_distance(existing_pt.q, existing_pt.r, q, r) == 1:
                            triggered = True
                    elif eff.trigger == EffectTrigger.ALL:
                        triggered = True
                    elif eff.trigger == EffectTrigger.ALL_OWN and owner_name == player_name:
                        triggered = True
                    elif eff.trigger == EffectTrigger.ALL_OTHER and owner_name != player_name:
                        triggered = True
                    elif eff.trigger == EffectTrigger.AFTER:
                        triggered = True

                    if triggered:
                        reason = f"Reacts to {new_tile_info.name if new_tile_info else 'Lake'}"
                        if eff.income is not None: changes.append(StatChangeDetail(source=info.name, stat="income", value=eff.income * mul, reason=reason))
                        if eff.reputation is not None: changes.append(StatChangeDetail(source=info.name, stat="reputation", value=eff.reputation * mul, reason=reason))
                        if eff.money is not None: changes.append(StatChangeDetail(source=info.name, stat="money", value=eff.money * mul, reason=reason))
                        if eff.population is not None: changes.append(StatChangeDetail(source=info.name, stat="population", value=eff.population * mul, reason=reason))

            if changes:
                if owner_name not in all_player_deltas: all_player_deltas[owner_name] = []
                all_player_deltas[owner_name].extend(changes)

    # --- Part 2: How the new tile reacts TO existing tiles (and its own base stats) ---
    if new_tile_info:
        mul = 1
        changes = []

        if new_tile_info.incomeChange: changes.append(StatChangeDetail(source=new_tile_info.name, stat="income", value=new_tile_info.incomeChange * mul, reason="Immediate: Base Value"))
        if new_tile_info.reputationChange: changes.append(StatChangeDetail(source=new_tile_info.name, stat="reputation", value=new_tile_info.reputationChange * mul, reason="Immediate: Base Value"))
        if new_tile_info.populationChange: changes.append(StatChangeDetail(source=new_tile_info.name, stat="population", value=new_tile_info.populationChange * mul, reason="Immediate: Base Value"))

        for eff in new_tile_info.effects:
            if eff.trigger in [EffectTrigger.ALL, EffectTrigger.ALL_OWN, EffectTrigger.ALL_OTHER]:
                boards_to_scan = []
                if eff.trigger == EffectTrigger.ALL: boards_to_scan = list(boards_map.values())
                elif eff.trigger == EffectTrigger.ALL_OWN: boards_to_scan = [active_board]
                elif eff.trigger == EffectTrigger.ALL_OTHER: boards_to_scan = [b for n, b in boards_map.items() if n != player_name]

                for board in boards_to_scan:
                    for tile_on_board in board:
                        tile_info = ALL_TILES.get(tile_on_board.tile_id) if not tile_on_board.is_lake else tile_on_board

                        if tile_info and _matches_target(tile_info, eff.target):
                            source_tile_name = getattr(tile_info, 'name', 'Lake')
                            reason = f"Bonus from {source_tile_name}"

                            if eff.money is not None:
                                changes.append(StatChangeDetail(source=new_tile_info.name, stat="money", value=eff.money * mul, reason=reason))
                            if eff.income is not None:
                                changes.append(StatChangeDetail(source=new_tile_info.name, stat="income", value=eff.income * mul, reason=reason))
                            if eff.reputation is not None:
                                changes.append(StatChangeDetail(source=new_tile_info.name, stat="reputation", value=eff.reputation * mul, reason=reason))
                            if eff.population is not None:
                                changes.append(StatChangeDetail(source=new_tile_info.name, stat="population", value=eff.population * mul, reason=reason))

            elif eff.trigger == EffectTrigger.ADJACENT:
                for neighbor_pt in active_board:
                    if hex_distance(neighbor_pt.q, neighbor_pt.r, q, r) == 1:
                        target_info = neighbor_pt if neighbor_pt.is_lake else ALL_TILES.get(neighbor_pt.tile_id)
                        if target_info and _matches_target(target_info, eff.target):
                            reason = f"Adjacent to {getattr(target_info, 'name', 'Lake')}"
                            if eff.income is not None: changes.append(StatChangeDetail(source=new_tile_info.name, stat="income", value=eff.income * mul, reason=reason))
                            if eff.reputation is not None: changes.append(StatChangeDetail(source=new_tile_info.name, stat="reputation", value=eff.reputation * mul, reason=reason))
                            if eff.population is not None: changes.append(StatChangeDetail(source=new_tile_info.name, stat="population", value=eff.population * mul, reason=reason))

        if changes:
            if player_name not in all_player_deltas: all_player_deltas[player_name] = []
            all_player_deltas[player_name].extend(changes)

    # --- Part 3: Lake Adjacency & Waterfront Realty Logic ---
    money_changes = []

    owner_wfr = next((t for t in active_board if t.tile_id == "WATERFRONT_REALTY"), None)
    wfr_base_bonus = 6 if owner_wfr and owner_wfr.has_investment else 4 if owner_wfr else LAKE_ADJACENCY_BONUS

    if action_type in ["CREATE_LAKE", "PLACE_TILE"]:
        if newly_placed_pt.is_lake:
            for neighbor_coord in get_neighbors(q, r):
                if any(t.q == neighbor_coord[0] and t.r == neighbor_coord[1] and not t.is_lake for t in active_board):
                    money_changes.append(StatChangeDetail(source="Lake", stat="money", value=wfr_base_bonus, reason="Adjacent to New Lake"))

        elif new_tile_info:
            for neighbor_coord in get_neighbors(q, r):
                neighbor_lake = next((t for t in active_board if t.q == neighbor_coord[0] and t.r == neighbor_coord[1] and t.is_lake), None)
                if neighbor_lake:
                    lake_multiplier = 2 if neighbor_lake.has_investment else 1
                    money_changes.append(StatChangeDetail(
                        source=new_tile_info.name,
                        stat="money",
                        value=wfr_base_bonus * lake_multiplier,
                        reason="Adjacent to Existing Lake"
                    ))

    elif action_type == "PLACE_INVESTMENT_MARKER" and newly_placed_pt.is_lake:
        for neighbor_coord in get_neighbors(q, r):
            if any(t.q == neighbor_coord[0] and t.r == neighbor_coord[1] and not t.is_lake for t in active_board):
                money_changes.append(StatChangeDetail(source="Lake Investment", stat="money", value=wfr_base_bonus, reason="Invested in Lake"))

    elif action_type == "PLACE_INVESTMENT_MARKER" and not newly_placed_pt.is_lake:
        for neighbor_coord in get_neighbors(q, r):
            neighbor_lake = next((t for t in active_board if t.q == neighbor_coord[0] and t.r == neighbor_coord[1] and t.is_lake), None)
            if neighbor_lake:
                lake_multiplier = 2 if neighbor_lake.has_investment else 1
                money_changes.append(StatChangeDetail(
                    source=new_tile_info.name if new_tile_info else "Investment",
                    stat="money",
                    value=wfr_base_bonus * lake_multiplier,
                    reason="Adjacent to Lake (Investment)"
                ))

    if new_tile_info and new_tile_info.id == "WATERFRONT_REALTY":
        unique_adjacent_coords = set()
        for lake in (t for t in active_board if t.is_lake):
            unique_adjacent_coords.update(get_neighbors(lake.q, lake.r))
        
        for coord in unique_adjacent_coords:
            if any(t.q == coord[0] and t.r == coord[1] and not t.is_lake for t in active_board):
                if action_type == "PLACE_TILE" and coord[0] == q and coord[1] == r:
                    continue
                money_changes.append(StatChangeDetail(source="Waterfront Realty", stat="money", value=2, reason="Gentrification Bonus"))

    if money_changes:
        if player_name not in all_player_deltas: all_player_deltas[player_name] = []
        all_player_deltas[player_name].extend(money_changes)

    return all_player_deltas

def apply_upkeep_and_recalculate(
    game_state: GameState,
    active_player_name: str,
    all_deltas: Dict[str, List[StatChangeDetail]],
    action_image: Optional[str] = None,
    action_label: Optional[str] = None,
    action_cost: Optional[int] = None,
    is_investment: bool = False
) -> None:
    active_player_obj = game_state.players.get(active_player_name)
    if not active_player_obj: return

    # NEW: Capture at the very beginning
    true_original_pop = active_player_obj.highest_population 

    # --- 1. IMMEDIATE EFFECTS (STATE UPDATE) ---
    for p_id, changes in all_deltas.items():
        player_obj = game_state.players.get(p_id)
        if not player_obj:
            continue
        money_delta = sum(c.value for c in changes if c.stat == 'money')
        pop_delta   = sum(c.value for c in changes if c.stat == 'population')
        player_obj.money += money_delta
        if pop_delta != 0:
            pop_before = player_obj.population
            player_obj.population = max(0, min(MAX_POPULATION, player_obj.population + pop_delta))
            lines_before = sum(1 for line in RED_LINES if pop_before >= line)
            lines_after  = sum(1 for line in RED_LINES if player_obj.population >= line)
            new_lines = lines_after - lines_before
            if new_lines > 0:
                board_totals, _ = recalc_board_stats(game_state, p_id)
                player_obj.income     = clamp_stat(board_totals['income']     - (lines_after))
                player_obj.reputation = clamp_stat(board_totals['reputation'] - (lines_after))

    # --- 2. CONDITIONAL EFFECTS & RECALCULATION ---
    for p_id, p_obj in game_state.players.items():
        board_totals, _ = recalc_board_stats(game_state, p_id)
        total_red_lines = sum(1 for line in RED_LINES if p_obj.population >= line)
        p_obj.income = clamp_stat(board_totals['income'] - total_red_lines)
        p_obj.reputation = clamp_stat(board_totals['reputation'] - total_red_lines)

    # --- 3. UPKEEP PHASE & EVENT LOGGING (Active Player Only) ---
    upkeep_changes = []
    red_line_changes = []
    pop_before_upkeep = active_player_obj.population

    upkeep_income = clamp_stat(active_player_obj.income)
    if upkeep_income >= 0:
        active_player_obj.money += upkeep_income
        upkeep_changes.append(StatChangeDetail(source="Upkeep", stat="money", value=upkeep_income, reason="Income Phase"))
    else:
        debt = abs(upkeep_income)
        can_pay = min(debt, active_player_obj.money)
        active_player_obj.money -= can_pay
        remaining_debt = debt - can_pay
        upkeep_changes.append(StatChangeDetail(source="Upkeep", stat="money", value=-can_pay, reason="Income Phase (negative)"))
        if remaining_debt > 0:
            pop_lost = min(remaining_debt, active_player_obj.population)
            active_player_obj.population -= pop_lost
            active_player_obj.population = max(0, active_player_obj.population)
            if pop_lost > 0:
                upkeep_changes.append(StatChangeDetail(source="Upkeep", stat="population", value=-pop_lost, reason="Bankrupt: paid debt with population"))

    upkeep_rep = clamp_stat(active_player_obj.reputation)
    active_player_obj.population += upkeep_rep
    if active_player_obj.population < 0:
        pop_deficit = abs(active_player_obj.population)
        can_pay = min(pop_deficit, active_player_obj.money)
        active_player_obj.money -= can_pay
        active_player_obj.population = 0
        if can_pay > 0:
            upkeep_changes.append(StatChangeDetail(source="Upkeep", stat="money", value=-can_pay, reason="Reputation penalty: paid to avoid negative population"))
    active_player_obj.population = max(0, min(MAX_POPULATION, active_player_obj.population))

    net_population_gain = active_player_obj.population - pop_before_upkeep
    if net_population_gain != 0:
        upkeep_changes.append(StatChangeDetail(source="Upkeep", stat="population", value=net_population_gain, reason="Reputation Phase"))

    # ---> NEW UNIFIED RED LINE LOGIC <---
    active_player_obj.highest_population = max(active_player_obj.highest_population, active_player_obj.population)
    
    lines_before_turn = sum(1 for line in RED_LINES if true_original_pop >= line)
    lines_after_turn = sum(1 for line in RED_LINES if active_player_obj.highest_population >= line)
    total_new_lines = lines_after_turn - lines_before_turn

    if total_new_lines > 0:
        reason_text = f"Crossed {total_new_lines} New Red Line(s)"

        red_line_changes.append(StatChangeDetail(source="Red Line Penalty", stat="income", value=-total_new_lines, reason=reason_text))
        red_line_changes.append(StatChangeDetail(source="Red Line Penalty", stat="reputation", value=-total_new_lines, reason=reason_text))

        player_board = game_state.player_boards.get(active_player_name, [])
        for tile in player_board:
            if tile.is_lake: continue
            info = ALL_TILES.get(tile.tile_id)
            if not info: continue
            mul = 2 if tile.has_investment else 1
            for eff in info.effects:
                if eff.trigger == EffectTrigger.INVESTMENT_LINE:
                    if eff.income:
                        red_line_changes.append(StatChangeDetail(source=info.name, stat="income", value=eff.income * mul * total_new_lines, reason=reason_text))
                    if eff.reputation:
                        red_line_changes.append(StatChangeDetail(source=info.name, stat="reputation", value=eff.reputation * mul * total_new_lines, reason=reason_text))

    # --- 4. LOGGING ---
    for p_id, p_obj in game_state.players.items():
        p_specific_deltas = all_deltas.get(p_id, [])

        if p_id == active_player_name:
            immediate_log = [c for c in p_specific_deltas if "Immediate:" in c.reason]
            conditional_log = [c for c in p_specific_deltas if "Immediate:" not in c.reason]

            summary = TurnSummary(
                player_name=p_id,
                player_color=p_obj.color,
                summary_id=f"{p_id}_{game_state.turn_number}_main",
                immediate_effects=immediate_log,
                conditional_effects=conditional_log,
                upkeep_effects=upkeep_changes,
                red_line_effects=red_line_changes,
                action_image=action_image,
                action_label=action_label,
                action_cost=action_cost,
                is_investment=is_investment,
                is_reaction=False
            )
            game_state.turn_history.append(summary)
            game_state.last_turn_summary = summary

        elif p_specific_deltas:
            summary = TurnSummary(
                player_name=p_id,
                player_color=p_obj.color,
                summary_id=f"{p_id}_{game_state.turn_number}_reaction",
                conditional_effects=p_specific_deltas,
                action_label=f"Reaction to {active_player_name}'s {action_label}",
                action_image=action_image,
                is_reaction=True
            )
            game_state.turn_history.append(summary)

def clamp_stat(
    value: int,
    min_val: int = MIN_INCOME_REPUTATION,
    max_val: int = MAX_INCOME_REPUTATION,
) -> int:
    """Clamp income/reputation values to game bounds"""
    return max(min_val, min(max_val, value))

def pop_next_tile_from_current_stack(game_state: GameState) -> Optional[str]:
    """Pops next tile from stack_abc. None if stack is empty."""
    stack_abc = game_state.tile_stack_abc
    if not stack_abc:
        return None
    return stack_abc.pop(0)

def recalc_board_stats(
    game_state: GameState,
    player_name: str
) -> Tuple[Dict[str, int], List[StatChangeDetail]]:
    """
    Compute the RAW potential Income and Reputation from a player's board.
    Population is NOT calculated here because it is a persistent score, not a rate.
    Money is NOT calculated here because it is handled during the upkeep phase.
    Note: INVESTMENT_LINE effects (Casino, PR Firm) are handled separately during
    red-line crossings in apply_upkeep_and_recalculate and are not included here,
    as they depend on runtime events rather than board state.
    """
    income = 0
    reputation = 0

    players_map = game_state.players
    boards_map = game_state.player_boards

    player = players_map.get(player_name)
    if not player:
        return {"income": 0, "reputation": 0}, []

    player_board = boards_map.get(player_name, [])

    timeline = [t for t in player_board if not t.is_lake]
    placed_tile_map = {(t.q, t.r): t for t in player_board}

    for idx, pt in enumerate(timeline):
        info = ALL_TILES.get(pt.tile_id)
        if not info:
            continue

        mul = 2 if pt.has_investment else 1

        # 1. Base Tile Stats
        income += info.incomeChange * mul
        reputation += info.reputationChange * mul

        # 2. Conditional Effects
        for eff in info.effects:
            val_income = eff.income or 0
            val_reputation = eff.reputation or 0

            if eff.trigger == EffectTrigger.ADJACENT:
                for nb_coords in get_neighbors(pt.q, pt.r):
                    q_nb, r_nb = nb_coords
                    neighbor_tile = placed_tile_map.get((q_nb, r_nb))
                    if not neighbor_tile:
                        continue

                    target_obj = neighbor_tile if neighbor_tile.is_lake else ALL_TILES.get(neighbor_tile.tile_id)
                    if target_obj and _matches_target(target_obj, eff.target):
                        income += val_income * mul
                        reputation += val_reputation * mul

            elif eff.trigger in [EffectTrigger.ALL, EffectTrigger.ALL_OWN, EffectTrigger.ALL_OTHER]:
                count = 0
                if eff.trigger == EffectTrigger.ALL:
                    boards_to_check = boards_map.values()
                elif eff.trigger == EffectTrigger.ALL_OWN:
                    boards_to_check = [player_board]
                else:
                    boards_to_check = [b for name, b in boards_map.items() if name != player_name]

                for board in boards_to_check:
                    for other_tile in board:
                        if other_tile.is_lake: continue

                        other_tile_data = ALL_TILES.get(other_tile.tile_id)
                        if other_tile_data and _matches_target(other_tile_data, eff.target):
                            count += 1

                if count > 0:
                    income += val_income * count * mul
                    reputation += val_reputation * count * mul

            elif eff.trigger == EffectTrigger.AFTER:
                later_tiles = timeline[idx + 1:]
                freq = sum(1 for later_pt in later_tiles if _matches_target(ALL_TILES.get(later_pt.tile_id), eff.target))
                if freq > 0:
                    income += val_income * freq * mul
                    reputation += val_reputation * freq * mul

            elif eff.trigger == EffectTrigger.INVESTMENT_MARKER:
                markers_placed = MAX_INVESTMENT_MARKERS - player.investment_markers
                if markers_placed > 0:
                    income += val_income * markers_placed * mul
                    reputation += val_reputation * markers_placed * mul

            # INVESTMENT_LINE is intentionally skipped here — see docstring above.

    return {"income": income, "reputation": reputation}, []

def slide_market_left_and_add_tile(game_state: GameState, removed_index: int) -> None:
    market = game_state.real_estate_market
    if removed_index < 0 or removed_index >= len(market):
        return

    market.pop(removed_index)
    new_tile = pop_next_tile_from_current_stack(game_state)

    if new_tile == "ONE_MORE_ROUND":
        game_state.is_last_round = True
        game_state.one_more_round_drawn = True

        current_player_id = game_state.current_turn_player_id
        current_idx = game_state.turn_order.index(current_player_id)
        num_players = len(game_state.turn_order)

        turns_to_finish_round = num_players - 1 - current_idx
        turns_in_final_round = num_players
        game_state.final_turn_countdown = turns_to_finish_round + turns_in_final_round + 1

        logging.info(f"Final round triggered! Turns remaining: {game_state.final_turn_countdown}")

        new_tile = pop_next_tile_from_current_stack(game_state)

    market.append(new_tile)
    game_state.real_estate_market = market

def end_game(game_state: GameState):
    if not game_state or not game_state.players:
        return []

    goal_results = evaluate_public_goals(
        game_state.players,
        game_state.player_boards,
        game_state.public_goals,
    )

    game_state.goal_winners = goal_results

    from .data.goals import GOALS

    for player_id, player in game_state.players.items():
        player.achieved_public_goals = []

        for goal_id, winners in goal_results.items():
            if player_id in winners:
                goal = GOALS.get(goal_id)
                if goal:
                    player.population += goal.populationBonus
                    player.achieved_public_goals.append(goal_id)

        if player.private_goal:
            goal = GOALS.get(player.private_goal)
            if goal and player_achieved_private_goal(
                player,
                goal,
                game_state.player_boards,
                game_state.players,
            ):
                player.population += goal.populationBonus
                player.achieved_private_goal = True
            else:
                player.achieved_private_goal = False

        player.population += player.money // 5

    rankings = sorted(
        game_state.players.items(),
        key=lambda item: (
            item[1].population,
            item[1].reputation,
            item[1].income,
            item[1].money,
        ),
        reverse=True,
    )

    game_state.game_over = True
    return rankings