# backend/app/goal_evaluator.py
from typing import List, Dict, Any, Tuple, Set, Optional
from .models import Player, PlacedTile, GoalConditionType, GoalTarget, TileCategory
from .data.tiles import get_all_tiles
from .data.goals import GOALS
from collections import deque

ALL_TILES = get_all_tiles()

def evaluate_public_goals(
    players: Dict[str, Player],
    player_boards: Dict[str, List[PlacedTile]],
    public_goals: List[str]
) -> Dict[str, List[str]]:
    """
    Evaluates all public goals and returns a dictionary mapping goal IDs to a list of winning player IDs.
    """
    goal_results = {}

    all_player_stats = {}
    for player_id in players:
        stats = calculate_player_stats_for_goals(player_id, players[player_id], player_boards[player_id], player_boards)
        all_player_stats[player_id] = stats

    for goal_id in public_goals:
        winning_players = evaluate_single_goal(goal_id, all_player_stats)
        goal_results[goal_id] = winning_players

    return goal_results


def evaluate_single_goal(goal_id: str, all_player_stats: Dict[str, Dict[str, Any]]) -> List[str]:
    goal_data = GOALS.get(goal_id)
    condition = goal_data.condition if goal_data else None

    if not condition:
        return []

    target = condition.target
    goal_type = condition.type
    required_value = condition.value

    if not target or not goal_type:
        return []

    player_values = {
        pid: get_stat_value(stats, target)
        for pid, stats in all_player_stats.items()
    }

    if goal_type == GoalConditionType.MOST:
        if not player_values: return []
        max_value = max(player_values.values())
        winners = [pid for pid, val in player_values.items() if val == max_value]
        return winners if len(winners) == 1 else []

    elif goal_type == GoalConditionType.FEWEST:
        if not player_values: return []
        min_value = min(player_values.values())
        winners = [pid for pid, val in player_values.items() if val == min_value]
        return winners if len(winners) == 1 else []

    elif goal_type == GoalConditionType.EXACTLY:
        winners = [pid for pid, val in player_values.items() if val == required_value]
        return winners if len(winners) == 1 else []

    elif goal_type == GoalConditionType.AT_LEAST:
        winners = [pid for pid, val in player_values.items() if val >= required_value]
        return winners if len(winners) == 1 else []

    return []


def calculate_player_stats_for_goals(
    player_id: str,
    player: Player,
    player_board: List[PlacedTile],
    all_boards: Dict[str, List[PlacedTile]]
) -> Dict[str, Any]:
    """
    Calculates a comprehensive set of statistics for a player used for goal evaluation.
    """
    stats = {
        "id": player_id,
        "money": player.money,
        "income": player.income,
        "reputation": player.reputation,
        "population": player.population,
        "investment_markers": player.investment_markers,
        "tiles": {
            "total": 0, "residential": 0, "commercial": 0, "industrial": 0,
            "civic": 0, "lakes": 0, "airports": 0, "waterfront": 0,
            "contiguous_lakes": _find_largest_contiguous_group(player_board, is_lake=True),
            "contiguous_civic": _find_largest_contiguous_group(player_board, tile_category=TileCategory.CIVIC),
        }
    }

    for tile in player_board:
        if tile.is_lake:
            stats["tiles"]["lakes"] += 1

    for placed_tile in player_board:
        if placed_tile.is_lake:
            continue

        stats["tiles"]["total"] += 1
        tile_data = ALL_TILES.get(placed_tile.tile_id)
        if not tile_data:
            continue

        category = tile_data.category.value if tile_data.category else ""
        if category == "Residential": stats["tiles"]["residential"] += 1
        elif category == "Commercial": stats["tiles"]["commercial"] += 1
        elif category == "Industrial": stats["tiles"]["industrial"] += 1
        elif category == "Civic": stats["tiles"]["civic"] += 1

        tile_type = tile_data.type.value if tile_data.type else ""
        if tile_type == "Airport" or "airport" in tile_data.name.lower():
            stats["tiles"]["airports"] += 1

    return stats


def get_stat_value(stats: Dict[str, Any], target: Any) -> int:
    """
    Helper function to extract a specific stat value based on the goal target.
    Accepts both GoalTarget enum instances and raw strings.
    """
    # Normalise to string so both enum values and raw strings work
    target_str = str(getattr(target, 'value', target))

    if target_str == "Money": return stats["money"]
    elif target_str == "Reputation": return stats["reputation"]
    elif target_str == "Income": return stats["income"]
    elif target_str == "InvestmentMarkers": return stats["investment_markers"]
    elif target_str == "Tiles": return stats["tiles"]["total"]
    elif target_str == "Residential": return stats["tiles"]["residential"]
    elif target_str == "Commercial": return stats["tiles"]["commercial"]
    elif target_str == "Industrial": return stats["tiles"]["industrial"]
    elif target_str == "Civic": return stats["tiles"]["civic"]
    elif target_str == "Lake": return stats["tiles"]["lakes"]
    elif target_str == "Airport": return stats["tiles"]["airports"]
    elif target_str == "ContiguousLakes": return stats["tiles"]["contiguous_lakes"]
    elif target_str == "ContiguousCivic": return stats["tiles"]["contiguous_civic"]
    else: return 0


def compute_goal_comparison(goal_id: str, players: Dict, player_boards: Dict) -> Dict:
    """
    Computes and compares all players' progress toward a single goal.
    """
    goal = GOALS.get(goal_id)
    if not goal:
        raise ValueError("Invalid goal ID")

    all_player_stats = {}
    for player_id, player in players.items():
        board = player_boards.get(player_id, [])
        stats = calculate_player_stats_for_goals(player_id, player, board, player_boards)
        all_player_stats[player_id] = stats

    player_values = {
        pid: get_stat_value(stats, goal.condition.target)
        for pid, stats in all_player_stats.items()
    }

    if not player_values:
        safe_goal_dict = goal.model_dump(by_alias=True, mode='json')
        return {"goal": safe_goal_dict, "comparison": []}

    comparison_data = []

    if goal.condition.type == GoalConditionType.MOST:
        max_value = max(player_values.values())
        winners = [pid for pid, val in player_values.items() if val == max_value]
        for player_id, value in player_values.items():
            status = (
                "tied" if value == max_value and len(winners) > 1
                else "leading" if value == max_value
                else "behind"
            )
            comparison_data.append({
                "name": players[player_id].name,
                "value": value,
                "status": status,
                "color": players[player_id].color,
            })

    elif goal.condition.type == GoalConditionType.FEWEST:
        min_value = min(player_values.values())
        winners = [pid for pid, val in player_values.items() if val == min_value]
        for player_id, value in player_values.items():
            status = (
                "tied" if value == min_value and len(winners) > 1
                else "leading" if value == min_value
                else "behind"
            )
            comparison_data.append({
                "name": players[player_id].name,
                "value": value,
                "status": status,
                "color": players[player_id].color,
            })

    else:
        # FIX: 'status' was undefined in this branch — compute it per player.
        required_value = goal.condition.value or 0
        for player_id, value in player_values.items():
            if goal.condition.type == GoalConditionType.EXACTLY:
                status = "leading" if value == required_value else "behind"
            elif goal.condition.type == GoalConditionType.AT_LEAST:
                status = "leading" if value >= required_value else "behind"
            else:
                status = "N/A"
            comparison_data.append({
                "name": players[player_id].name,
                "value": value,
                "status": status,
                "color": players[player_id].color,
            })

    sort_reverse = goal.condition.type == GoalConditionType.MOST
    comparison_data.sort(key=lambda x: x['value'], reverse=sort_reverse)

    safe_goal_dict = goal.model_dump(by_alias=True, mode='json')
    return {"goal": safe_goal_dict, "comparison": comparison_data}


def _find_largest_contiguous_group(
    player_board: List[PlacedTile],
    tile_category: Optional[TileCategory] = None,
    is_lake: bool = False
) -> int:
    """
    Finds the size of the largest group of contiguous tiles of a specific type
    using a Breadth-First Search (BFS) algorithm.
    """
    if not player_board:
        return 0

    max_group_size = 0
    visited: Set[Tuple[int, int]] = set()

    tile_map = {(tile.q, tile.r): tile for tile in player_board}

    for tile in player_board:
        coords = (tile.q, tile.r)

        if coords in visited:
            continue

        tile_data = ALL_TILES.get(tile.tile_id)
        is_target_type = (is_lake and tile.is_lake) or \
                         (tile_category and not tile.is_lake and tile_data and tile_data.category == tile_category)

        if not is_target_type:
            continue

        current_group_size = 0
        q = deque([coords])
        visited.add(coords)

        while q:
            current_coords = q.popleft()
            current_group_size += 1

            for neighbor_q, neighbor_r in [
                (current_coords[0] + 1, current_coords[1]), (current_coords[0] - 1, current_coords[1]),
                (current_coords[0], current_coords[1] + 1), (current_coords[0], current_coords[1] - 1),
                (current_coords[0] + 1, current_coords[1] - 1), (current_coords[0] - 1, current_coords[1] + 1)
            ]:
                neighbor_coords = (neighbor_q, neighbor_r)
                if neighbor_coords in visited or neighbor_coords not in tile_map:
                    continue

                neighbor_tile = tile_map[neighbor_coords]
                neighbor_tile_data = ALL_TILES.get(neighbor_tile.tile_id)
                is_neighbor_target_type = (is_lake and neighbor_tile.is_lake) or \
                                          (tile_category and not neighbor_tile.is_lake and neighbor_tile_data and neighbor_tile_data.category == tile_category)

                if is_neighbor_target_type:
                    visited.add(neighbor_coords)
                    q.append(neighbor_coords)

        max_group_size = max(max_group_size, current_group_size)

    return max_group_size


def player_achieved_private_goal(
    player: Any,
    goal: Any,
    all_boards: Dict[str, List[PlacedTile]],
    players: Dict[str, Any]
) -> bool:
    """
    Determines if a specific player has achieved their private goal.
    """
    stats = calculate_player_stats_for_goals(
        player_id=player.id,
        player=player,
        player_board=all_boards.get(player.id, []),
        all_boards=all_boards
    )

    condition = getattr(goal, "condition", None)
    if not condition:
        return False

    goal_type = getattr(condition, "type", None)
    target = getattr(condition, "target", None)
    if not goal_type or not target:
        return False

    all_values = {
        pid: get_stat_value(
            calculate_player_stats_for_goals(
                pid, p, all_boards.get(pid, []), all_boards
            ),
            target,
        )
        for pid, p in players.items()
    }

    if not all_values:
        return False

    if goal_type == GoalConditionType.MOST:
        max_val = max(all_values.values())
        winners = [pid for pid, val in all_values.items() if val == max_val]
        return len(winners) == 1 and player.id in winners

    elif goal_type == GoalConditionType.FEWEST:
        min_val = min(all_values.values())
        winners = [pid for pid, val in all_values.items() if val == min_val]
        return len(winners) == 1 and player.id in winners

    player_value = get_stat_value(stats, target)

    if goal_type == GoalConditionType.EXACTLY:
        return player_value == getattr(condition, "value", 0)

    elif goal_type == GoalConditionType.AT_LEAST:
        return player_value >= getattr(condition, "value", 0)

    return False
