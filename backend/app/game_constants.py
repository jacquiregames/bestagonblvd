# backend/app/game_constants.py

STARTING_MONEY = 15
STARTING_POPULATION = 2
STARTING_INCOME = 0
STARTING_REPUTATION = 1
MIN_INCOME_REPUTATION = -5
MAX_INCOME_REPUTATION = 15
NUM_INITIAL_MARKET_TILES_FROM_A = 4
NUM_PUBLIC_GOALS = 4
MAX_INVESTMENT_MARKERS = 3
MAX_POPULATION = 150
MARKET_COST_MODIFIERS = [0, 0, 2, 4, 6, 8, 10]   
MARKET_STACK_ORDER = ['A', 'B', 'C']  

BASIC_TILE_LIMIT = 8
REAL_ESTATE_MARKET_SIZE = 7
MONEY_TO_POPULATION_RATIO = 5
LAKE_ADJACENCY_BONUS = 2 
AIRPORT_EFFECT_RANGE = 3

TWO_PLAYER_STACK_SIZE = 15
THREE_PLAYER_STACK_SIZE = 18
FOUR_PLAYER_STACK_SIZE = 21

# Decorative "waterfront" row rendered above the playable board (see topRow
# in GameBoard.tsx). These hexes are background art, not real board space —
# no tile may ever be placed on them. Must be kept in sync with the
# frontend's `topRow` array.
OFF_BOARD_CELLS = frozenset([
    (-1, 2), (0, 2), (1, 1), (2, 1), (3, 0), (4, 0), (5, -1), (6, -1), (7, -2),
])


RED_LINES = [14, 21, 28, 34, 40, 46, 52, 58, 63, 68, 73, 77, 81, 85, 88, 91, 94, 97, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150]