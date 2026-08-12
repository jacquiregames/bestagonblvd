# backend/app/main.py
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Any, Dict, Optional 
from .data.tiles import TILES_A, TILES_B, TILES_C, TILES_BASIC
from .data.goals import GOALS
from .game_constants import (
    STARTING_MONEY, STARTING_POPULATION, STARTING_INCOME, STARTING_REPUTATION,
    MAX_INVESTMENT_MARKERS, MARKET_COST_MODIFIERS, NUM_PUBLIC_GOALS,
    BASIC_TILE_LIMIT, REAL_ESTATE_MARKET_SIZE, LAKE_ADJACENCY_BONUS,
    TWO_PLAYER_STACK_SIZE, THREE_PLAYER_STACK_SIZE, FOUR_PLAYER_STACK_SIZE,
    MAX_POPULATION,
)
from .game_rules import apply_upkeep_and_recalculate, initialize_basic_tiles
from .engine import apply_action, advance_turn_or_end_game
from .models import GameState, LobbyPlayer, Player, PlacedTile, UndoRequestState, StatChangeDetail, TileCategory
from .schemas import JoinRequest, UndoRequestSchema, UndoVoteSchema, RemoveBotRequest, DiscardMarketTileAction, Action, ActionType 
from .websocket import manager
from . import bot
import json
import random
import asyncio
import logging
import socket  

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GAME_STATE: Optional[GameState] = GameState()
game_state_lock = asyncio.Lock()
TURN_SNAPSHOTS: Dict[int, str] = {}

CATEGORY_COLORS = {
    TileCategory.RESIDENTIAL: '#00C459',
    TileCategory.COMMERCIAL: '#0089D4',
    TileCategory.INDUSTRIAL: '#FFC019',
    TileCategory.CIVIC: '#6B6666'
}

def build_tile_pool(tiles_dict):
    pool = []
    for tile_id, tile_data in tiles_dict.items():
        # If limit is None for some reason, default to 1
        count = tile_data.limit or 1
        pool.extend([tile_id] * count)
    return pool

async def broadcast_lobby_update():
    await manager.broadcast(
        json.dumps(
            {
                "type": "lobby_update",
                "players": [p.model_dump(by_alias=True, mode='json') for p in GAME_STATE.lobby_players],
            }
        )
    )
 
async def broadcast_game_state():
    await manager.broadcast(
        json.dumps(
            {
                "type": "game_update",
                "game_state": GAME_STATE.model_dump(by_alias=True, mode='json'),
            }
        )
    )

@app.get("/game_data")
def get_game_data():
    tiles_data = {}
    
    # Inject "set" and "background" manually to avoid changing all Python constants
    for k, v in TILES_BASIC.items():
        d = v.model_dump(by_alias=True, mode='json')
        d['set'] = 'basic'
        d['background'] = CATEGORY_COLORS.get(v.category, '#6B6666') if v.category else '#6B6666'
        tiles_data[k] = d
    for k, v in TILES_A.items():
        d = v.model_dump(by_alias=True, mode='json')
        d['set'] = 'A'
        d['background'] = CATEGORY_COLORS.get(v.category, '#6B6666') if v.category else '#6B6666'
        tiles_data[k] = d
    for k, v in TILES_B.items():
        d = v.model_dump(by_alias=True, mode='json')
        d['set'] = 'B'
        d['background'] = CATEGORY_COLORS.get(v.category, '#6B6666') if v.category else '#6B6666'
        tiles_data[k] = d
    for k, v in TILES_C.items():
        d = v.model_dump(by_alias=True, mode='json')
        d['set'] = 'C'
        d['background'] = CATEGORY_COLORS.get(v.category, '#6B6666') if v.category else '#6B6666'
        tiles_data[k] = d
        
    return {
        "tiles": tiles_data,
        "goals": {k: v.model_dump(by_alias=True, mode='json') for k, v in GOALS.items()}
    }

@app.get("/game_state")
async def get_game_state():
    async with game_state_lock:
        if not GAME_STATE:
            raise HTTPException(status_code=404, detail="Game not found")
        return GAME_STATE.model_dump(by_alias=True, mode='json')

@app.get("/constants")
def get_constants():
    from . import game_constants
    return {k: getattr(game_constants, k) for k in dir(game_constants) if k.isupper()}

@app.get("/goal_comparison")
def goal_comparison(goal_id: str = Query(...)):
    from .goal_evaluator import compute_goal_comparison
    if not GAME_STATE or not GAME_STATE.game_started:
        raise HTTPException(status_code=404, detail="Game not active")
    try:
        return compute_goal_comparison(
            goal_id, GAME_STATE.players, GAME_STATE.player_boards
        )
    except Exception as e:
        logging.error(f"Error in /goal_comparison for goal_id={goal_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset_game")
async def reset_game():
    global GAME_STATE
    async with game_state_lock:
        GAME_STATE = GameState()
    logging.info("Game has been reset.")
    await manager.broadcast(json.dumps({"type": "game_reset"}))
    return {"message": "Game reset successfully"}

@app.post("/join")
async def join_game(player_data: JoinRequest):
    player_name = player_data.player_name
    player_color = player_data.color

    async with game_state_lock:
        if GAME_STATE.game_started:
            raise HTTPException(status_code=403, detail="Game has already started")

        if any(p.name == player_name for p in GAME_STATE.lobby_players):
            raise HTTPException(status_code=409, detail="Player name is already taken")

        if any(p.color == player_color for p in GAME_STATE.lobby_players):
            raise HTTPException(status_code=409, detail="Player color is already taken")

        new_player = LobbyPlayer(name=player_name, color=player_color)
        GAME_STATE.lobby_players.append(new_player)
        
        # Serialize the players within the lock
        players_payload = [p.model_dump(by_alias=True, mode='json') for p in GAME_STATE.lobby_players]

    await broadcast_lobby_update()
    return {"players": players_payload}

MAX_LOBBY_PLAYERS = 4  # matches the engine's tile-stack sizing, which only branches for 2/3/"4 or more"

@app.post("/add_bot")
async def add_bot():
    async with game_state_lock:
        if GAME_STATE.game_started:
            raise HTTPException(status_code=403, detail="Game has already started")

        if len(GAME_STATE.lobby_players) >= MAX_LOBBY_PLAYERS:
            raise HTTPException(status_code=409, detail=f"Lobby is full (max {MAX_LOBBY_PLAYERS} players)")

        existing_names = [p.name for p in GAME_STATE.lobby_players]
        existing_colors = [p.color for p in GAME_STATE.lobby_players]

        bot_color = bot.make_bot_color(existing_colors)
        if not bot_color:
            raise HTTPException(status_code=409, detail="No colors left for a bot")

        new_bot = LobbyPlayer(name=bot.make_bot_name(existing_names), color=bot_color, is_bot=True)
        GAME_STATE.lobby_players.append(new_bot)

        players_payload = [p.model_dump(by_alias=True, mode='json') for p in GAME_STATE.lobby_players]

    await broadcast_lobby_update()
    return {"players": players_payload}

@app.post("/remove_bot")
async def remove_bot(req: RemoveBotRequest):
    async with game_state_lock:
        if GAME_STATE.game_started:
            raise HTTPException(status_code=403, detail="Game has already started")

        match = next((p for p in GAME_STATE.lobby_players if p.name == req.name and p.is_bot), None)
        if not match:
            raise HTTPException(status_code=404, detail="No bot with that name in the lobby")

        GAME_STATE.lobby_players.remove(match)
        players_payload = [p.model_dump(by_alias=True, mode='json') for p in GAME_STATE.lobby_players]

    await broadcast_lobby_update()
    return {"players": players_payload}
    
@app.post("/start_game")
async def start_game():
    async with game_state_lock:
        if len(GAME_STATE.lobby_players) < 1:
            raise HTTPException(status_code=400, detail="Not enough players to start")

        GAME_STATE.game_started = True
        num_players = len(GAME_STATE.lobby_players)

        if num_players == 2:
            stack_size = TWO_PLAYER_STACK_SIZE
            c_tiles_for_shuffle = 6
        elif num_players == 3:
            stack_size = THREE_PLAYER_STACK_SIZE
            c_tiles_for_shuffle = 9
        else:
            stack_size = FOUR_PLAYER_STACK_SIZE
            c_tiles_for_shuffle = 12

        stack_a = build_tile_pool(TILES_A)
        random.shuffle(stack_a)
        stack_a = stack_a[:stack_size]

        stack_b = build_tile_pool(TILES_B)
        random.shuffle(stack_b)
        stack_b = stack_b[:stack_size]

        all_c_tiles = [
            t_id for t_id in build_tile_pool(TILES_C) 
            if t_id != "ONE_MORE_ROUND"
        ]
        random.shuffle(all_c_tiles)
        total_c_tiles_needed = 5 + 4 + c_tiles_for_shuffle
        c_tiles_for_stack = all_c_tiles[:total_c_tiles_needed]
        
        stack_abc = []
        stack_abc.extend(stack_a)
        stack_abc.extend(stack_b)
        stack_abc.extend(c_tiles_for_stack) 

        insert_position = len(stack_abc) - 4
        stack_abc.insert(insert_position, "ONE_MORE_ROUND")

        GAME_STATE.tile_stack_abc = stack_abc
        GAME_STATE.basic_tiles = list(TILES_BASIC.keys())
        GAME_STATE.basic_tile_quantities = initialize_basic_tiles(num_players)

        GAME_STATE.real_estate_market = [
            GAME_STATE.tile_stack_abc.pop(0) if GAME_STATE.tile_stack_abc else None
            for _ in range(REAL_ESTATE_MARKET_SIZE)
        ]

        all_goals = list(GOALS.keys())
        random.shuffle(all_goals)
        GAME_STATE.public_goals = all_goals[:NUM_PUBLIC_GOALS]
        private_goals_pool = all_goals[NUM_PUBLIC_GOALS:]

        random.shuffle(GAME_STATE.lobby_players)
        GAME_STATE.turn_order = [p.name for p in GAME_STATE.lobby_players]
        GAME_STATE.current_turn_player_id = None
        GAME_STATE.turn_number = 1

        for lobby_player in GAME_STATE.lobby_players:
            player = Player(
                id=lobby_player.name,
                name=lobby_player.name,
                color=lobby_player.color,
                money=STARTING_MONEY,
                income=STARTING_INCOME,
                population=STARTING_POPULATION,
                reputation=STARTING_REPUTATION,
                investment_markers=MAX_INVESTMENT_MARKERS,
                is_bot=lobby_player.is_bot,
            )

            if len(private_goals_pool) >= 2:
                player.private_goal_options = [
                    private_goals_pool.pop(0),
                    private_goals_pool.pop(0),
                ]

            GAME_STATE.players[lobby_player.name] = player
            GAME_STATE.player_boards[lobby_player.name] = [
                PlacedTile(tile_id="SUBURBS", q=3, r=1),
                PlacedTile(tile_id="COMMUNITY_PARK", q=3, r=2),
                PlacedTile(tile_id="HEAVY_FACTORY", q=3, r=3),
            ]

            apply_upkeep_and_recalculate(GAME_STATE, player.name, {})

        GAME_STATE.is_goal_selection_phase = True
        
        # Serialize state within lock        
        state_payload = GAME_STATE.model_dump(by_alias=True, mode='json')

    await manager.broadcast(json.dumps({"type": "game_started", "game_state": state_payload}))
    asyncio.create_task(run_bots_if_needed())
    return {"message": "Game started! Players must now select a private goal."}
    
@app.post("/undo/request")
async def request_undo(req: UndoRequestSchema):
    async with game_state_lock:
        if GAME_STATE.has_acted_this_turn:
            raise HTTPException(status_code=400, detail="Current player has already acted.")
        
        # --- ADD THIS CHECK ---
        if GAME_STATE.turn_number <= 1:
            raise HTTPException(status_code=400, detail="Cannot undo on the first turn.")
        
        turn_idx = GAME_STATE.turn_order.index(GAME_STATE.current_turn_player_id)
        prev_idx = (turn_idx - 1) % len(GAME_STATE.turn_order)
        if GAME_STATE.turn_order[prev_idx] != req.player_name:
            raise HTTPException(status_code=400, detail="Only the previous player can undo.")

        GAME_STATE.active_undo_request = UndoRequestState(requester=req.player_name)
    
    await broadcast_game_state()
    # A bot might be one of the other players whose vote is needed to resolve
    # this — without this, an undo request could sit unanswered forever if
    # every other seat but one is a bot.
    asyncio.create_task(run_bots_if_needed())
    return {"message": "Undo requested"}

def _cast_undo_vote(player_name: str, vote: str, turn_snapshots: Dict[int, str]) -> dict:
    """
    Core of casting a single undo vote (and executing the undo if this vote
    tips it over the threshold). Mutates the GLOBAL GAME_STATE — including,
    on execution, reassigning it wholesale to the restored snapshot — so
    callers must hold game_state_lock. Shared by the /undo/vote endpoint and
    the bot loop (bots always approve; see bot.choose_undo_vote) so there's
    only one implementation of "what does casting a vote actually do".

    Returns {"result": "rejected", "requester": ...} | {"result": "executed"}
    | {"result": "recorded"}.
    """
    global GAME_STATE
    # Grab a local reference first — this protects us from the "rug pull"
    # when GAME_STATE is entirely replaced during the snapshot restore below.
    active_req = GAME_STATE.active_undo_request
    if not active_req:
        raise HTTPException(status_code=400, detail="No active undo request.")

    if vote == "reject":
        requester = active_req.requester
        GAME_STATE.active_undo_request = None
        return {"result": "rejected", "requester": requester}

    active_req.votes[player_name] = "approve"
    num_players = len(GAME_STATE.players)
    if len(active_req.votes) >= num_players - 1:
        snapshot_json = turn_snapshots.get(GAME_STATE.turn_number - 1)
        if snapshot_json:
            # Universally use model_validate_json for Pydantic V2
            GAME_STATE = GameState.model_validate_json(snapshot_json)
            return {"result": "executed"}
        else:
            GAME_STATE.active_undo_request = None
            raise HTTPException(status_code=500, detail="Snapshot not found.")

    return {"result": "recorded"}

@app.post("/undo/vote")
async def vote_undo(vote_req: UndoVoteSchema):
    async with game_state_lock:
        outcome = _cast_undo_vote(vote_req.player_name, vote_req.vote, TURN_SNAPSHOTS)

    # Broadcasts happen safely outside the lock
    if outcome["result"] == "rejected":
        await manager.broadcast(json.dumps({"type": "undo_rejected", "requester": outcome["requester"]}))
        msg_to_return = "Undo rejected"
    elif outcome["result"] == "executed":
        msg_to_return = "Undo executed"
    else:
        msg_to_return = "Vote recorded"

    await broadcast_game_state()
    # Either another bot still needs to vote, or the undo executed and it's
    # now (again) a bot's turn to act.
    asyncio.create_task(run_bots_if_needed())
    return {"message": msg_to_return}

@app.post("/action")
async def player_action(action: Action):
    player_name = action.player_name

    async with game_state_lock:
        try:
            response_payload = apply_action(GAME_STATE, action, turn_snapshots=TURN_SNAPSHOTS)
        except HTTPException:
            raise
        except Exception as e:
            logging.exception("Error in /action for player %s", player_name)
            raise HTTPException(status_code=500, detail=str(e))

    # Outside the lock, safely broadcast the modified state
    if response_payload:
        await broadcast_game_state()
        asyncio.create_task(run_bots_if_needed())
        return response_payload

# --- Bot orchestration --------------------------------------------------------
# Bots never get a "cheat path" into the game: every decision below is
# expressed as a normal Action (or an undo vote) and run through the exact
# same apply_action()/_cast_undo_vote() functions a real player's HTTP
# request would go through.

BOT_TURN_LOCK = asyncio.Lock()
BOT_THINK_SECONDS = 1.1  # brief pause so a bot's move doesn't feel instant/jarring
MAX_BOT_STEPS_PER_WAKEUP = 50  # safety cap against any unforeseen infinite loop

async def run_bots_if_needed():
    """
    Repeatedly performs the next bot step — selecting a private goal, voting
    on an undo request, discarding a market tile, or taking a main turn
    action — until it's no longer a bot's turn to do anything. Safe to call
    after any state-changing endpoint; if a loop is already running, this
    just returns immediately and lets that loop notice the new state on its
    next iteration, so concurrent triggers never race each other.
    """
    if BOT_TURN_LOCK.locked():
        return

    async with BOT_TURN_LOCK:
        for _ in range(MAX_BOT_STEPS_PER_WAKEUP):
            await asyncio.sleep(BOT_THINK_SECONDS)

            pending_broadcasts = []
            async with game_state_lock:
                if not GAME_STATE.game_started or GAME_STATE.game_over:
                    return

                acted = False

                # 1. Goal selection phase — any bot that hasn't picked yet
                if GAME_STATE.is_goal_selection_phase:
                    for name, player in GAME_STATE.players.items():
                        if player.is_bot and name not in GAME_STATE.players_who_selected_goal:
                            try:
                                goal_action = bot.choose_goal_selection_action(GAME_STATE, name)
                                apply_action(GAME_STATE, goal_action, turn_snapshots=TURN_SNAPSHOTS)
                            except Exception:
                                logging.exception("Bot %s failed to select a goal", name)
                            acted = True
                            break

                # 2. Undo vote — any bot that hasn't voted on an active request
                if not acted and GAME_STATE.active_undo_request:
                    req = GAME_STATE.active_undo_request
                    for name, player in GAME_STATE.players.items():
                        if player.is_bot and name != req.requester and name not in req.votes:
                            vote = bot.choose_undo_vote(GAME_STATE, name)
                            try:
                                outcome = _cast_undo_vote(name, vote, TURN_SNAPSHOTS)
                                if outcome["result"] == "rejected":
                                    pending_broadcasts.append(
                                        {"type": "undo_rejected", "requester": outcome["requester"]}
                                    )
                            except Exception:
                                logging.exception("Bot %s failed to vote on an undo request", name)
                            acted = True
                            break

                # 3. Mandatory discard
                if not acted and GAME_STATE.player_awaiting_discard:
                    awaiting_name = GAME_STATE.player_awaiting_discard
                    awaiting_player = GAME_STATE.players.get(awaiting_name)
                    if awaiting_player and awaiting_player.is_bot:
                        try:
                            discard_action = bot.choose_discard_action(GAME_STATE, awaiting_name)
                            apply_action(GAME_STATE, discard_action, turn_snapshots=TURN_SNAPSHOTS)
                        except Exception:
                            logging.exception("Bot %s failed to discard; forcing slot 0", awaiting_name)
                            try:
                                fallback = DiscardMarketTileAction(
                                    player_name=awaiting_name, type="DISCARD_MARKET_TILE", market_index=0
                                )
                                apply_action(GAME_STATE, fallback, turn_snapshots=TURN_SNAPSHOTS)
                            except Exception:
                                logging.exception("Bot %s fallback discard also failed", awaiting_name)
                        acted = True

                # 4. Main turn action
                if (
                    not acted
                    and not GAME_STATE.is_goal_selection_phase
                    and not GAME_STATE.player_awaiting_discard
                    and not GAME_STATE.active_undo_request
                    and GAME_STATE.current_turn_player_id
                ):
                    current_player = GAME_STATE.players.get(GAME_STATE.current_turn_player_id)
                    if current_player and current_player.is_bot:
                        action = None
                        try:
                            action = await bot.choose_main_action(GAME_STATE, current_player.name)
                        except Exception:
                            logging.exception("Bot AI raised while choosing a move for %s", current_player.name)

                        if action is None:
                            action = bot.choose_fallback_action(GAME_STATE, current_player.name)

                        if action is not None:
                            try:
                                apply_action(GAME_STATE, action, turn_snapshots=TURN_SNAPSHOTS)
                            except Exception:
                                logging.exception("Bot %s's chosen action failed to apply", current_player.name)
                            acted = True
                        else:
                            # Truly no legal action available (money too low
                            # for even the cheapest basic tile) — a rare edge
                            # case that could in principle strand a human
                            # too. Don't hang the whole table waiting on it.
                            logging.warning(
                                "Bot %s has no legal action available; skipping its turn.",
                                current_player.name,
                            )
                            GAME_STATE.has_acted_this_turn = True
                            advance_turn_or_end_game(GAME_STATE, current_player.name)
                            acted = True

                if not acted:
                    return  # nothing left for any bot to do right now

            await broadcast_game_state()
            for msg in pending_broadcasts:
                await manager.broadcast(json.dumps(msg))
        else:
            logging.warning("run_bots_if_needed hit its iteration cap; stopping defensively.")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        if GAME_STATE.game_started:
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "game_update",
                        "game_state": GAME_STATE.model_dump(by_alias=True, mode='json'),
                    }
                )
            )
        else:
            await websocket.send_text(
                json.dumps(
                    {
                        "type": "lobby_update",
                        "players": [p.model_dump(by_alias=True, mode='json') for p in GAME_STATE.lobby_players],
                    }
                )
            )

        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)
 
def get_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.settimeout(0)
    try: 
        s.connect(('10.254.254.254', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

if __name__ == "__main__":
    import uvicorn
    logging.basicConfig(level=logging.INFO) 
    local_ip = get_ip()
    port = 3000
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
