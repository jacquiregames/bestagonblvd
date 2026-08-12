// src/types.ts

export type TileCategory = 'Residential' | 'Commercial' | 'Industrial' | 'Civic';
export type TileType = 'Dealerships' | 'Restaurant' | 'Office' | 'Airport' | 'School' | 'Skyscraper' | null;

export type EffectTrigger = 
  | 'self' | 'adjacent' | 'all' | 'allOwn' | 'allOther' | 'after' | 'investmentLine' | 'investmentMarker';

export type EffectTarget = 
  | TileCategory | TileType | 'Lake' | 'Freeway' | 'InvestmentMarker' | 'HasReputation' | string[];

export interface TileEffect {
  trigger: EffectTrigger;
  target?: EffectTarget;
  income?: number;
  population?: number;
  reputation?: number;
  money?: number;
}

export interface HexTile {
  id: string;
  key: string;
  name: string;
  image: string;
  category: TileCategory;
  type: TileType;
  cost: number;
  incomeChange: number;
  populationChange: number;
  reputationChange: number;
  effects: TileEffect[];
  description: string;
  limit: number | null;
  isUnique: boolean;
  set: string;
  background: string;
}

export type GoalConditionType = 'most' | 'fewest' | 'exactly' | 'atLeast';
export type GoalTarget =
  | 'Lake' | 'Airport' | 'Money' | 'Tiles' | 'Income' | 'Reputation' | 'InvestmentMarkers' 
  | 'Residential' | 'Commercial' | 'Industrial' | 'Civic' | 'ContiguousLakes' | 'ContiguousCivic';
  
export interface GoalCondition {
  type: GoalConditionType;
  target: GoalTarget;
  value?: number;
}

export interface Goal {
  id: string;
  key: string;
  name: string;
  image: string;
  description: string;
  condition: GoalCondition;
  populationBonus: number;
  set: 'Base' | 'Promo';
}

export interface Player {
  id: string;
  name: string;
  color: string;
  money: number;
  income: number;
  population: number;
  reputation: number;
  investmentMarkers: number;
  privateGoal?: string;
  privateGoalOptions?: string[]; 
  redLinesCrossed?: number; 
  achievedPublicGoals?: string[];
  achievedPrivateGoal?: boolean;  
  isBot?: boolean;
}

export interface PlacedTile {
  tileId: string;
  q: number;
  r: number;
  isLake: boolean;
  hasInvestment: boolean;
  originalTileId?: string;
}
 
export interface StatChangeDetail {
  source: string;
  stat: 'money' | 'income' | 'reputation' | 'population';
  value: number;
  reason: string;
}

export interface UndoRequestState {
  requester: string;
  votes: Record<string, string>;
}

export interface TurnSummary {
  playerName: string;
  playerColor?: string;
  summaryId: string;
  immediateEffects: StatChangeDetail[];
  conditionalEffects: StatChangeDetail[];
  upkeepEffects: StatChangeDetail[];
  redLineEffects: StatChangeDetail[];
  actionImage?: string;
  actionLabel?: string;
  isInvestment?: boolean;
  actionCost?: number;
  isReaction?: boolean;
}

export interface GameState {
  lobbyPlayers: { name: string; color: string }[];
  gameStarted: boolean;
  gameOver: boolean;
  isLastRound?: boolean;
  oneMoreRoundDrawn: boolean;
  pendingActionDelta: Record<string, StatChangeDetail[]>;
  players: Record<string, Player>;
  turnOrder: string[];
  currentTurnPlayerId: string | null;
  turnNumber: number;
  tileStackAbc: string[];
  realEstateMarket: (string | null)[];
  basicTiles: string[];
  basicTileQuantities: Record<string, number>; 
  publicGoals: string[];
  goalWinners?: Record<string, string[]>;
  isGoalSelectionPhase?: boolean;  
  playersWhoSelectedGoal?: string[]; 
  playerBoards: Record<string, PlacedTile[]>;
  playerAwaitingDiscard?: string | null;  
  turnHistory: TurnSummary[]; 
  lastTurnSummary?: TurnSummary; 
  finalTurnCountdown?: number; 
  hasActedThisTurn?: boolean;
  activeUndoRequest?: UndoRequestState | null;
}

export interface LobbyPlayer {
  name: string;
  color: string;
  isBot?: boolean;
}
