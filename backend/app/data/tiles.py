# backend/app/data/tiles.py
from typing import Dict
from ..models import HexTile

from .A import TilesA
from .B import TilesB
from .C import TilesC
from .basic_tiles import TilesBasic

TILES_A = TilesA
TILES_B = TilesB
TILES_C = TilesC
TILES_BASIC = TilesBasic

def get_all_tiles() -> Dict[str, HexTile]:
    """Merge all tiles into a single dict."""
    return {**TilesBasic, **TilesA, **TilesB, **TilesC}
