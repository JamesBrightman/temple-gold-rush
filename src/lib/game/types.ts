import type {
  HAZARD_TYPES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  TOTAL_ROUNDS
} from "@/lib/game/constants";

export type HazardType = (typeof HAZARD_TYPES)[number];

export type PlayerDecision = "continue" | "leave";

export type DeckCard =
  | { kind: "treasure"; value: number }
  | { kind: "hazard"; hazard: HazardType }
  | { kind: "artifact" };

export type TrailCard =
  | { id: string; kind: "treasure"; value: number; leftover: number }
  | { id: string; kind: "hazard"; hazard: HazardType }
  | { id: string; kind: "artifact" };

export type RoomPhase = "lobby" | "in_round" | "round_end" | "finished";

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  bankedGems: number;
  roundGems: number;
  artifacts: number;
  artifactPoints: number;
  inTemple: boolean;
  hasLeftRound: boolean;
}

export interface RoundState {
  number: number;
  path: TrailCard[];
  pathLooseGems: number;
  artifactsOnPath: number;
  pendingDecision: boolean;
  decisions: Record<string, PlayerDecision>;
  revealDecisions: Record<string, PlayerDecision> | null;
  revealEndsAt: number | null;
  hazardsSeen: Record<HazardType, number>;
  deckCount: number;
  remainingDeck: {
    total: number;
    treasure: number;
    artifact: number;
    hazards: Record<HazardType, number>;
  };
  bustHazard: HazardType | null;
  lastDrawnCard: TrailCard | null;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  phase: RoomPhase;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  roundNumber: number;
  startPlayerIndex: number;
  removedHazards: Record<HazardType, number>;
  artifactsIntroduced: number;
  artifactsRemoved: number;
  artifactsClaimed: number;
  deck: DeckCard[];
  currentRound: RoundState | null;
  transitionEndsAt: number | null;
  winnerIds: string[];
  log: string[];
  updatedAt: number;
}

export interface ClientRoomState {
  roomId: string;
  hostId: string;
  phase: RoomPhase;
  playerOrder: string[];
  players: Record<string, PlayerState>;
  roundNumber: number;
  totalRounds: typeof TOTAL_ROUNDS;
  minPlayers: typeof MIN_PLAYERS;
  maxPlayers: typeof MAX_PLAYERS;
  startPlayerId: string | null;
  removedHazards: Record<HazardType, number>;
  currentRound: RoundState | null;
  transitionEndsAt: number | null;
  winnerIds: string[];
  log: string[];
  updatedAt: number;
}

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
