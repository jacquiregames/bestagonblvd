# backend/app/engine.py
"""
Core turn-resolution engine.

This is the single source of truth for "what happens when a given Action is
applied to a given GameState". It used to live inline in main.py's /action
endpoint; it's pulled out here so that:

  1. main.py's /action endpoint can call it against the real, module-level
     GAME_STATE (recording undo snapshots as it goes), and
  2. bot.py's AI can call the *exact same* function against a scratch,
     deep-copied GameState to find out "what would happen if I did this?"
     when scoring candidate moves — with zero risk of the bot's rules
     understanding drifting out of sync with the real rules, because it's
     not a second implementation, it's the same one.

Nothing in here is async and nothing here broadcasts over the websocket —
those concerns stay in main.py, which wraps calls to `apply_action` with the
game_state_lock and the broadcast afterward.
"""
import logging
from typing import Dict, Optional

from fastapi import HTTPException

from .data.tiles import TILES_B, TILES_C, get_all_tiles
from .game_constants import MARKET_COST_MODIFIERS
from .game_rules import (
    apply_upkeep_and_recalculate, slide_market_left_and_add_tile,
    end_game, calculate_action_delta,
)
from .utils import validate_placement
from .models import GameState, PlacedTile, StatChangeDetail
from .schemas import Action, ActionType

ALL_TILES = get_all_tiles()


def advance_turn_or_end_game(game_state: GameState, player_name: str):
    """
    Advances turn to next player, or ends the game if the countdown expires.

    Takes `game_state` explicitly (rather than a module-level global) so the
    exact same logic can run against a scratch copy of the state when the
    bot AI is simulating a candidate move.
    """
    if not game_state.turn_order:
        return

    should_end = False

    if game_state.final_turn_countdown is not None:
        game_state.final_turn_countdown -= 1
        if game_state.final_turn_countdown == 0:
            should_end = True

    if should_end:
        try:
            end_game(game_state)
        except Exception as e:
            logging.error(f"Error ending game: {e}")
            game_state.game_over = True
        return

    current_turn_index = game_state.turn_order.index(player_name)
    game_state.turn_number += 1
    next_turn_index = (current_turn_index + 1) % len(game_state.turn_order)
    game_state.current_turn_player_id = game_state.turn_order[next_turn_index]

    game_state.has_acted_this_turn = False


def apply_action(
    game_state: GameState,
    action: Action,
    turn_snapshots: Optional[Dict[int, str]] = None,
) -> dict:
    """
    Applies `action` to `game_state` in place and returns the response
    payload, raising HTTPException on invalid actions.

    `turn_snapshots`, if given, is the dict used to record undo snapshots.
    Pass the real module-level TURN_SNAPSHOTS (from main.py) for genuine
    player actions. Leave it as None (the default) when `game_state` is a
    scratch copy being used to score a hypothetical bot move — this
    guarantees a bot's internal "what if I did this" evaluation can never
    write into the real undo history.
    """
    player_name = action.player_name
    action_type = action.type  # plain string, e.g. "PLACE_TILE"

    response_payload = None

    player = game_state.players.get(player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    # -----------------------------
    # 1. GOAL SELECTION PHASE
    # -----------------------------
    if action_type == ActionType.SELECT_PRIVATE_GOAL:
        if not game_state.is_goal_selection_phase:
            raise HTTPException(status_code=403, detail="Not in goal selection phase.")
        goal_id = action.goal_id
        if goal_id not in player.private_goal_options:
            raise HTTPException(status_code=400, detail="Invalid goal selection.")

        player.private_goal = goal_id
        player.private_goal_options = []
        game_state.players_who_selected_goal.append(player_name)

        if len(game_state.players_who_selected_goal) == len(game_state.players):
            game_state.is_goal_selection_phase = False
            game_state.current_turn_player_id = game_state.turn_order[0]

        response_payload = {"message": f"Player {player_name} selected their goal."}
    else:
        if game_state.is_goal_selection_phase:
            raise HTTPException(status_code=403, detail="All players must select a goal first.")

        # -----------------------------
        # 2. TURN VALIDATION
        # -----------------------------
        if (
            game_state.player_awaiting_discard == player_name
            and action_type != ActionType.DISCARD_MARKET_TILE
        ):
            raise HTTPException(status_code=403, detail="You must discard a tile from the market.")
        elif (
            game_state.current_turn_player_id != player_name
            and game_state.player_awaiting_discard != player_name
        ):
            raise HTTPException(status_code=403, detail="It's not your turn")

        log_deltas = {}
        log_img, log_label, log_cost = None, "", None
        turn_is_complete = False

        # -----------------------------
        # 3. MAIN ACTIONS
        # -----------------------------
        if not game_state.has_acted_this_turn and action_type != ActionType.DISCARD_MARKET_TILE:
            if turn_snapshots is not None:
                # Save the snapshot for the current turn
                turn_snapshots[game_state.turn_number] = game_state.model_dump_json(by_alias=True)

                # Prevent memory leak: purge old turn snapshots (keep only the previous turn)
                keys_to_delete = [t for t in turn_snapshots.keys() if t < game_state.turn_number - 1]
                for k in keys_to_delete:
                    del turn_snapshots[k]
            game_state.has_acted_this_turn = True

        if action_type == ActionType.PLACE_TILE:
            tile_id, q, r, market_index = action.tile_id, action.q, action.r, action.market_index
            player_board = game_state.player_boards[player_name]

            is_valid, err = validate_placement(player_board, q, r)
            if not is_valid: raise HTTPException(status_code=400, detail=err)

            real_market = game_state.real_estate_market
            if not (isinstance(market_index, int) and 0 <= market_index < len(real_market) and real_market[market_index] == tile_id):
                raise HTTPException(status_code=400, detail="Invalid market index or tile mismatch")

            tile_data = ALL_TILES.get(tile_id)
            if not tile_data:
                raise HTTPException(status_code=400, detail="Unknown tile_id")
            total_cost = tile_data.cost + MARKET_COST_MODIFIERS[market_index]
            if player.money < total_cost: raise HTTPException(status_code=403, detail="Not enough money.")

            player.money -= total_cost
            player_board.append(PlacedTile(tile_id=tile_id, q=q, r=r))

            log_deltas = calculate_action_delta(game_state, player_name, (q, r), action_type)
            log_img, log_label, log_cost = tile_data.image, f"Built {tile_data.name}", total_cost

            slide_market_left_and_add_tile(game_state, market_index)
            turn_is_complete = True

        elif action_type == ActionType.CREATE_LAKE:
            market_index, q, r = action.market_index, action.q, action.r
            player_board = game_state.player_boards[player_name]

            is_valid, err = validate_placement(player_board, q, r)
            if not is_valid: raise HTTPException(status_code=400, detail=err)

            if not (isinstance(market_index, int) and 0 <= market_index < len(game_state.real_estate_market)):
                raise HTTPException(status_code=400, detail="Invalid market index")

            # --- ADD THIS CHECK ---
            if game_state.real_estate_market[market_index] is None:
                raise HTTPException(status_code=400, detail="Cannot create a lake from an empty market slot.")

            tile_id = game_state.real_estate_market[market_index]
            cost = MARKET_COST_MODIFIERS[market_index]
            if player.money < cost: raise HTTPException(status_code=403, detail="Not enough money.")

            player.money -= cost
            player_board.append(PlacedTile(tile_id="LAKE", q=q, r=r, is_lake=True, original_tile_id=tile_id))

            log_deltas = calculate_action_delta(game_state, player_name, (q, r), action_type)
            tile_set = "a"
            if tile_id in TILES_B: tile_set = "b"
            elif tile_id in TILES_C: tile_set = "c"
            log_img, log_label, log_cost = f"assets/tiles/lakes/lake_{tile_set}.webp", "Created a Lake", cost

            slide_market_left_and_add_tile(game_state, market_index)
            turn_is_complete = True

        elif action_type == ActionType.PLACE_BASIC_TILE:
            q, r = action.q, action.r
            tile_id = action.tile_id
            player_board = game_state.player_boards[player_name]
            tile_data = ALL_TILES.get(tile_id)
            if not tile_data:
                raise HTTPException(status_code=400, detail="Unknown tile_id")

            # --- ADD THIS CHECK ---
            if game_state.basic_tile_quantities.get(tile_id, 0) <= 0:
                raise HTTPException(status_code=400, detail="This basic tile is sold out.")

            is_valid, err = validate_placement(player_board, q, r)
            if not is_valid: raise HTTPException(status_code=400, detail=err)
            if player.money < tile_data.cost: raise HTTPException(status_code=403, detail="Not enough money.")

            player.money -= tile_data.cost
            player_board.append(PlacedTile(tile_id=tile_id, q=q, r=r))
            game_state.basic_tile_quantities[tile_id] -= 1

            game_state.pending_action_delta = calculate_action_delta(game_state, player_name, (q, r), action_type)
            game_state.pending_log_image, game_state.pending_log_label, game_state.pending_log_cost = tile_data.image, f"Built {tile_data.name}", tile_data.cost
            game_state.player_awaiting_discard = player_name

            response_payload = {"message": "Discard required"}


        elif action_type == ActionType.PLACE_INVESTMENT_MARKER:
            q, r = action.q, action.r
            player_board = game_state.player_boards[player_name]

            tile_to_invest = next((t for t in player_board if t.q == q and t.r == r), None)
            if not tile_to_invest:
                raise HTTPException(status_code=400, detail="Tile not found on your board.")
            if tile_to_invest.has_investment:
                raise HTTPException(status_code=400, detail="Tile already has an investment marker.")
            if player.investment_markers <= 0:
                raise HTTPException(status_code=400, detail="No investment markers left.")

            if tile_to_invest.is_lake:
                original_tile_id = tile_to_invest.original_tile_id
                if not original_tile_id:
                    raise HTTPException(status_code=500, detail="Lake is missing original tile ID.")
                log_cost = 0
                tile_set = "a"
                if original_tile_id in TILES_B: tile_set = "b"
                elif original_tile_id in TILES_C: tile_set = "c"
                log_label = "Invested in Lake"
                log_img = f"assets/tiles/lakes/lake_{tile_set}.webp"
            else:
                tile_data = ALL_TILES.get(tile_to_invest.tile_id)
                if player.money < tile_data.cost:
                    raise HTTPException(status_code=403, detail="Not enough money.")
                log_label = f"Invested in {tile_data.name}"
                log_cost = tile_data.cost
                log_img = tile_data.image

            player.money -= log_cost
            player.investment_markers -= 1
            tile_to_invest.has_investment = True

            game_state.pending_action_delta = calculate_action_delta(game_state, player_name, (q, r), action_type)
            game_state.pending_log_image, game_state.pending_log_label, game_state.pending_log_cost = log_img, log_label, log_cost
            game_state.player_awaiting_discard = player_name

            response_payload = {"message": "Discard required"}

        elif action_type == ActionType.DISCARD_MARKET_TILE:
            market_index = action.market_index

            if not (isinstance(market_index, int) and 0 <= market_index < len(game_state.real_estate_market)):
                raise HTTPException(status_code=400, detail="Invalid market index")

            # --- ADD THIS CHECK ---
            if game_state.real_estate_market[market_index] is None:
                raise HTTPException(status_code=400, detail="Cannot discard an empty market slot.")

            discard_cost = MARKET_COST_MODIFIERS[market_index]
            if player.money < discard_cost:
                raise HTTPException(status_code=403, detail="Not enough money to discard this tile.")
 

            if discard_cost > 0:
                if game_state.pending_action_delta.get(player_name) is None:
                    game_state.pending_action_delta[player_name] = []
                game_state.pending_action_delta[player_name].append(
                    StatChangeDetail(source="Market Discard", stat="money", value=-discard_cost, reason="Paid Market Fee")
                )

            slide_market_left_and_add_tile(game_state, market_index)

            log_deltas = game_state.pending_action_delta
            log_img, log_label, log_cost = game_state.pending_log_image, game_state.pending_log_label, game_state.pending_log_cost

            game_state.pending_log_image, game_state.pending_log_label, game_state.pending_log_cost, game_state.pending_action_delta = None, None, None, {}
            game_state.player_awaiting_discard = None
            turn_is_complete = True

        # -----------------------------
        # 4. FINAL TURN COMPLETION
        # -----------------------------
        if turn_is_complete:
            is_invest = bool(log_label and "Invested" in log_label)
            apply_upkeep_and_recalculate(
                game_state, player_name, log_deltas,
                action_image=log_img, action_label=log_label, action_cost=log_cost,
                is_investment=is_invest
            )
            advance_turn_or_end_game(game_state, player_name)
            response_payload = {"message": "Action successful"}

    return response_payload
