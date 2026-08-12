// src/services/api.ts
import axios, { AxiosError } from "axios";

// Dynamically determine the backend host so the app works on any LAN machine
const backendHost = window.location.hostname;
const API_URL = `http://${backendHost}:3000`;
export const WS_URL = `ws://${backendHost}:3000/ws`;

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError && error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return "An unexpected error occurred.";
};

export const api = {
  getGameData: async (): Promise<any> => {
    const res = await axios.get(`${API_URL}/game_data`);
    return res.data;
  },

  getGameState: async (): Promise<any> => {
    const res = await axios.get(`${API_URL}/game_state`);
    return res.data;
  },

  getConstants: async (): Promise<any> => {
    const res = await axios.get(`${API_URL}/constants`);
    return res.data;
  },

  joinGame: async (playerName: string, color: string) => {
    const payload = { player_name: playerName, color };
    const res = await axios.post(`${API_URL}/join`, payload);
    return res.data;
  },

  addBot: async () => {
    const res = await axios.post(`${API_URL}/add_bot`);
    return res.data;
  },

  removeBot: async (name: string) => {
    const payload = { name };
    const res = await axios.post(`${API_URL}/remove_bot`, payload);
    return res.data;
  },

  startGame: async () => {
    const res = await axios.post(`${API_URL}/start_game`);
    return res.data;
  },

  requestUndo: async (playerName: string) => {
    const payload = { player_name: playerName };
    const res = await axios.post(`${API_URL}/undo/request`, payload);
    return res.data;
  },

  voteUndo: async (playerName: string, vote: 'approve' | 'reject') => {
    const payload = { player_name: playerName, vote };
    const res = await axios.post(`${API_URL}/undo/vote`, payload);
    return res.data;
  },

  selectPrivateGoal: async (playerName: string, goalId: string) => {
    const payload = {
      player_name: playerName,
      type: "SELECT_PRIVATE_GOAL",
      goal_id: goalId,
    };
    const res = await axios.post(`${API_URL}/action`, payload);
    return res.data;
  },

  // FIX: Added an optional AbortSignal parameter so callers can cancel in-flight
  // requests (e.g. when the mouse quickly leaves a goal icon before the response
  // arrives). The signal is passed to axios via its `signal` config option.
  getGoalComparison: async (goalId: string, signal?: AbortSignal): Promise<any> => {
    const res = await axios.get(`${API_URL}/goal_comparison`, {
      params: { goal_id: goalId },
      signal,
    });
    return res.data;
  },

  resetGame: async () => {
    const res = await axios.post(`${API_URL}/reset_game`);
    return res.data;
  },

  placeTile: async (
    playerName: string,
    tileId: string,
    q: number,
    r: number,
    marketIndex: number
  ) => {
    const payload = {
      player_name: playerName,
      type: "PLACE_TILE",
      tile_id: tileId,
      q,
      r,
      market_index: marketIndex,
    };
    const res = await axios.post(`${API_URL}/action`, payload);
    return res.data;
  },

  placeBasicTile: async (
    playerName: string,
    tileId: string,
    q: number,
    r: number
  ) => {
    const payload = {
      player_name: playerName,
      type: "PLACE_BASIC_TILE",
      tile_id: tileId,
      q,
      r,
    };
    const res = await axios.post(`${API_URL}/action`, payload);
    return res.data;
  },

  createLake: async (
    playerName: string,
    marketIndex: number,
    q: number,
    r: number
  ) => {
    try {
      const payload = {
        player_name: playerName,
        type: "CREATE_LAKE",
        market_index: marketIndex,
        q,
        r,
      };
      const res = await axios.post(`${API_URL}/action`, payload);
      return res.data;
    } catch (err) {
      console.error("Failed to create lake:", getErrorMessage(err));
      throw err;
    }
  },

  placeInvestmentMarker: async (playerName: string, q: number, r: number) => {
    const payload = {
      player_name: playerName,
      type: "PLACE_INVESTMENT_MARKER",
      q,
      r,
    };
    const res = await axios.post(`${API_URL}/action`, payload);
    return res.data;
  },

  discardMarketTile: async (playerName: string, marketIndex: number) => {
    const payload = {
      player_name: playerName,
      type: "DISCARD_MARKET_TILE",
      market_index: marketIndex,
    };
    const res = await axios.post(`${API_URL}/action`, payload);
    return res.data;
  },

  playerAction: async (actionData: any) => {
    const res = await axios.post(`${API_URL}/action`, actionData);
    return res.data;
  },
};

