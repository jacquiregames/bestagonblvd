# backend/app/utils.py
from typing import List, Tuple, Optional, Any, TYPE_CHECKING

from .game_constants import OFF_BOARD_CELLS

# Prevent circular imports while allowing type checking
if TYPE_CHECKING:
    from .models import PlacedTile

def get_neighbors(q: int, r: int) -> List[Tuple[int, int]]:
    """Returns axial coordinates for all 6 neighbors of a hex."""
    return [
        (q + 1, r), (q - 1, r),
        (q, r + 1), (q, r - 1),
        (q + 1, r - 1), (q - 1, r + 1)
    ]

def calculate_adjacency_bonus(player_board: List['PlacedTile'], q: int, r: int) -> int:
    """$2 bonus per adjacent tile when creating a lake."""
    bonus = 0
    occupied_hexes = {(t.q, t.r) for t in player_board}
    lake_neighbors = get_neighbors(q, r)

    for neighbor in lake_neighbors:
        if neighbor in occupied_hexes:
            bonus += 2

    return bonus

def hex_distance(q1: int, r1: int, q2: int, r2: int) -> int:
    """
    Calculates the Manhattan distance between two hexes in an axial coordinate system.
    Used to check if tiles are adjacent (distance == 1).
    """
    return (abs(q1 - q2) + abs(q1 + r1 - q2 - r2) + abs(r1 - r2)) // 2

def validate_placement(board: List['PlacedTile'], q: int, r: int) -> Tuple[bool, Optional[str]]:
    """
    Validate that (q,r) is a legal placement on `board`.
    """
    if (q, r) in OFF_BOARD_CELLS:
        return False, "That space is off the board"

    occupied = {(t.q, t.r) for t in board}

    # Position is already occupied
    if (q, r) in occupied:
        return False, "Space is already occupied"

    # No tiles on board yet - first tile can go anywhere
    if not board:
        return True, None

    # Check for adjacency to at least one existing tile
    neighbors = get_neighbors(q, r)
    for neighbor_q, neighbor_r in neighbors:
        if (neighbor_q, neighbor_r) in occupied:
            return True, None

    # No adjacent tiles found
    return False, "Must be placed adjacent to an existing tile"

def _matches_target(tile_meta: Any, target: Any) -> bool:
    """
    Flexible comparison helper: determines whether tile metadata `tile_meta`
    matches `target`. `target` may be None, a single value, or list-like.

    This is the single canonical implementation — game_rules.py imports from here.
    """
    if target is None:
        return True

    try:
        if isinstance(target, (list, tuple, set)):
            return any(_matches_target(tile_meta, t) for t in target)
    except Exception:
        pass

    cat = getattr(tile_meta, "category", None)
    if cat is not None:
        if target == cat:
            return True
        if getattr(target, "value", None) == getattr(cat, "value", None):
            return True

    ttype = getattr(tile_meta, "type", None)
    if ttype is not None:
        if target == ttype:
            return True
        if getattr(target, "value", None) == getattr(ttype, "value", None):
            return True

    # Fallback: direct string/value comparison (handles lake PlacedTile check)
    if getattr(tile_meta, 'is_lake', False):
        target_str = str(getattr(target, 'value', target))
        return target_str == "Lake"

    return target == tile_meta
