# backend/app/models.py
from enum import Enum
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )

class EffectTrigger(str, Enum):
    SELF = "self"
    ADJACENT = "adjacent"
    ALL = "all"
    ALL_OWN = "allOwn"
    ALL_OTHER = "allOther"
    AFTER = "after"
    INVESTMENT_LINE = "investmentLine"
    INVESTMENT_MARKER = "investmentMarker"
    
class EffectTarget(str, Enum):
    LAKE = "Lake"
    FREEWAY = "Freeway"
    INVESTMENT_MARKER = "InvestmentMarker"
    HAS_REPUTATION = "HasReputation"

class GoalConditionType(str, Enum):
    MOST = "most"
    FEWEST = "fewest"
    EXACTLY = "exactly"
    AT_LEAST = "atLeast"

class GoalTarget(str, Enum):
    LAKE = "Lake"
    CONTIGUOUS_LAKES = "ContiguousLakes"
    CONTIGUOUS_CIVIC = "ContiguousCivic"
    AIRPORT = "Airport"
    MONEY = "Money"
    TILES = "Tiles"
    INCOME = "Income"
    REPUTATION = "Reputation" 
    INVESTMENT_MARKERS = "InvestmentMarkers"  
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    CIVIC = "Civic"

class TileCategory(str, Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    CIVIC = "Civic"

class TileType(str, Enum):
    AIRPORT = "Airport"
    CIVIC = "Civic"
    COMMERCIAL = "Commercial"
    DEALERSHIP = "Dealership"
    INDUSTRIAL = "Industrial"  
    LAKE = "Lake"    
    OFFICE = "Office"     
    RESIDENTIAL = "Residential"  
    RESTAURANT = "Restaurant"
    SCHOOL = "School"   
    SKYSCRAPER = "Skyscraper"

class GoalCondition(CamelModel):
    type: GoalConditionType
    target: GoalTarget
    value: Optional[int] = None

class TileEffect(CamelModel):
    trigger: EffectTrigger
    target: Optional[Union[TileCategory, TileType, EffectTarget, List[str]]] = None
    income: Optional[int] = None
    population: Optional[int] = None
    reputation: Optional[int] = None
    money: Optional[int] = None

class Goal(CamelModel):
    id: str
    key: str
    name: str
    image: str
    description: str
    condition: GoalCondition
    populationBonus: int
    set: str

class HexTile(CamelModel):
    id: str
    key: str
    name: str
    image: str
    category: TileCategory
    type: Optional[TileType]
    cost: int
    incomeChange: int
    populationChange: int
    reputationChange: int 
    effects: List[TileEffect]
    description: str
    limit: Optional[int]
    isUnique: bool
    set: str

class LobbyPlayer(CamelModel):
    name: str
    color: str
    is_bot: bool = False

class Player(CamelModel):
    id: str
    name: str
    color: str
    money: int = 15
    income: int = 0
    reputation: int = 1
    population: int = 2
    highest_population: int = 2  # Add this!
    investment_markers: int = 3
    private_goal: Optional[str] = None    
    private_goal_options: List[str] = []
    achieved_public_goals: List[str] = []  
    achieved_private_goal: bool = False  
    is_bot: bool = False

class StatChangeDetail(CamelModel):
    source: str          
    stat: str            
    value: int           
    reason: str          
    
class TurnSummary(CamelModel):
    player_name: str
    player_color: Optional[str] = None
    summary_id: str
    immediate_effects: List[StatChangeDetail] = []
    conditional_effects: List[StatChangeDetail] = []
    upkeep_effects: List[StatChangeDetail] = []
    red_line_effects: List[StatChangeDetail] = []
    action_image: Optional[str] = None
    action_label: Optional[str] = None
    action_cost: Optional[int] = None 
    is_investment: bool = False
    is_reaction: bool = False 

class PlacedTile(CamelModel):
    tile_id: str
    q: int
    r: int
    is_lake: bool = False
    has_investment: bool = False
    original_tile_id: Optional[str] = None

class UndoRequestState(CamelModel):
    requester: str
    votes: Dict[str, str] = {}

class GameState(CamelModel):
    lobby_players: List[LobbyPlayer] = []
    game_started: bool = False
    game_over: bool = False
    is_last_round: bool = False    
    is_goal_selection_phase: bool = False
    players: Dict[str, Player] = {}
    turn_order: List[str] = []
    current_turn_player_id: Optional[str] = None
    tile_stack_abc: List[str] = []
    real_estate_market: List[Optional[str]] = []
    basic_tiles: List[str] = []
    basic_tile_quantities: Dict[str, int] = {}
    public_goals: List[str] = []    
    players_who_selected_goal: List[str] = []
    goal_winners: Dict[str, List[str]] = {}
    player_boards: Dict[str, List[PlacedTile]] = {}    
    turn_number: int = 0    
    final_turn_countdown: Optional[int] = None  
    one_more_round_drawn: bool = False  
    player_awaiting_discard: Optional[str] = None 
    last_turn_summary: Optional[TurnSummary] = None
    turn_history: List[TurnSummary] = []
    pending_log_image: Optional[str] = None 
    pending_log_label: Optional[str] = None 
    pending_log_cost: Optional[int] = None 
    pending_action_delta: Dict[str, List[StatChangeDetail]] = {}
    has_acted_this_turn: bool = False
    active_undo_request: Optional[UndoRequestState] = None
