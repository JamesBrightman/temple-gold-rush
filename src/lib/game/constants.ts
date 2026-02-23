export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
export const TOTAL_ROUNDS = 5;

export const TREASURE_VALUES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const;

export const HAZARD_TYPES = [
  "spiders",
  "snakes",
  "mummy",
  "fire",
  "rockfall",
] as const;

export const ARTIFACT_VALUES = [5, 5, 5, 10, 10] as const;

export const PLAYER_COLORS = [
  "#1e4d3e",
  "#8f4c23",
  "#b26527",
  "#2f6f5f",
] as const;

export const ROOM_CODE_LENGTH = 5;

export const ROUND_TRANSITION_MS = 4000;
export const DECISION_REVEAL_MS = 3000;
