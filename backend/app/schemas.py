# backend\app\schemas.py
from enum import Enum
from typing import Literal, Union, Annotated
from pydantic import BaseModel, Field, ConfigDict

class ActionType(str, Enum):
    PLACE_TILE = "PLACE_TILE"
    PLACE_BASIC_TILE = "PLACE_BASIC_TILE"
    CREATE_LAKE = "CREATE_LAKE"
    PLACE_INVESTMENT_MARKER = "PLACE_INVESTMENT_MARKER"
    DISCARD_MARKET_TILE = "DISCARD_MARKET_TILE"
    SELECT_PRIVATE_GOAL = "SELECT_PRIVATE_GOAL"

class BaseAction(BaseModel):
    player_name: str = Field(..., alias="player_name")
    type: str

    model_config = ConfigDict(
        populate_by_name = True,
        use_enum_values = True
    )

class CreateLakeAction(BaseAction):
    type: Literal["CREATE_LAKE"]
    market_index: int
    q: int
    r: int

class PlaceBasicTileAction(BaseAction):
    type: Literal["PLACE_BASIC_TILE"]
    tile_id: str
    q: int
    r: int

class PlaceInvestmentAction(BaseAction):
    type: Literal["PLACE_INVESTMENT_MARKER"]
    q: int
    r: int

class PlaceTileAction(BaseAction):
    type: Literal["PLACE_TILE"]
    tile_id: str
    q: int
    r: int
    market_index: int

class DiscardMarketTileAction(BaseAction):
    type: Literal["DISCARD_MARKET_TILE"]
    market_index: int

class SelectPrivateGoalAction(BaseAction):
    type: Literal["SELECT_PRIVATE_GOAL"]
    goal_id: str

class JoinRequest(BaseModel):
    player_name: str
    color: Literal['black', 'blue', 'cyan', 'green', 'grey', 'orange', 'purple', 'red', 'white', 'yellow']

class UndoRequestSchema(BaseModel):
    player_name: str

class UndoVoteSchema(BaseModel):
    player_name: str
    vote: Literal['approve', 'reject']

class RemoveBotRequest(BaseModel):
    name: str
    
ActionRequest = Union[
    PlaceTileAction,
    PlaceBasicTileAction,
    CreateLakeAction,
    PlaceInvestmentAction,
    DiscardMarketTileAction,
    SelectPrivateGoalAction,
]

# Discriminated on the `type` field so FastAPI picks the exact subclass
# (and returns a clear 422 naming the bad/missing field) instead of
# silently falling back to .get() with None on typos or missing keys.
Action = Annotated[ActionRequest, Field(discriminator="type")]
