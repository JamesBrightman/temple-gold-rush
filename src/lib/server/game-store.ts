import {
  ARTIFACT_VALUES,
  DECISION_REVEAL_MS,
  HAZARD_TYPES,
  MAX_PLAYERS,
  MIN_PLAYERS,
  PLAYER_COLORS,
  ROUND_TRANSITION_MS,
  TOTAL_ROUNDS,
  TREASURE_VALUES
} from "@/lib/game/constants";
import { createRoomCode, now, sanitizeName, shuffle } from "@/lib/game/utils";
import type {
  ActionResult,
  ClientRoomState,
  DeckCard,
  HazardType,
  PlayerDecision,
  PlayerState,
  RoundState,
  RoomState,
  TrailCard
} from "@/lib/game/types";
import { emitRoomUpdate } from "@/lib/server/realtime";

type EndReason = "all_left" | "hazard_bust" | "deck_empty";

const LOG_LIMIT = 18;

const makeHazardMap = (): Record<HazardType, number> => ({
  spiders: 0,
  snakes: 0,
  mummy: 0,
  fire: 0,
  rockfall: 0
});

class GameStore {
  private rooms = new Map<string, RoomState>();

  private nextRoundTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private decisionRevealTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private ok<T>(data: T): ActionResult<T> {
    return { ok: true, data };
  }

  private fail<T>(error: string): ActionResult<T> {
    return { ok: false, error };
  }

  private buildDeck(room: RoomState): DeckCard[] {
    const uniqueTreasureValues = [...new Set(TREASURE_VALUES)];
    const deck: DeckCard[] = uniqueTreasureValues.map((value) => ({
      kind: "treasure",
      value
    }));

    for (const hazard of HAZARD_TYPES) {
      const remaining = Math.max(0, 3 - room.removedHazards[hazard]);

      for (let i = 0; i < remaining; i += 1) {
        deck.push({ kind: "hazard", hazard });
      }
    }

    const artifactCardsInDeck = Math.max(0, ARTIFACT_VALUES.length - room.artifactsRemoved);

    for (let i = 0; i < artifactCardsInDeck; i += 1) {
      deck.push({ kind: "artifact" });
    }

    return shuffle(deck);
  }

  private getRoomById(roomId: string): RoomState | null {
    const normalizedRoom = roomId.trim().toUpperCase();
    return this.rooms.get(normalizedRoom) ?? null;
  }

  private getActivePlayerIds(room: RoomState): string[] {
    return room.playerOrder.filter((playerId) => room.players[playerId]?.inTemple);
  }

  private addLog(room: RoomState, message: string): void {
    room.log = [message, ...room.log].slice(0, LOG_LIMIT);
  }

  private getRemainingDeck(room: RoomState): RoundState["remainingDeck"] {
    const hazards = makeHazardMap();
    let treasure = 0;
    let artifact = 0;

    for (const card of room.deck) {
      if (card.kind === "treasure") {
        treasure += 1;
      } else if (card.kind === "artifact") {
        artifact += 1;
      } else {
        hazards[card.hazard] += 1;
      }
    }

    return {
      total: room.deck.length,
      treasure,
      artifact,
      hazards
    };
  }

  private touch(room: RoomState): void {
    room.updatedAt = now();
  }

  private toClientRoom(room: RoomState): ClientRoomState {
    const players: ClientRoomState["players"] = {};

    for (const id of room.playerOrder) {
      players[id] = { ...room.players[id] };
    }

    return {
      roomId: room.roomId,
      hostId: room.hostId,
      phase: room.phase,
      playerOrder: [...room.playerOrder],
      players,
      roundNumber: room.roundNumber,
      totalRounds: TOTAL_ROUNDS,
      minPlayers: MIN_PLAYERS,
      maxPlayers: MAX_PLAYERS,
      startPlayerId: room.playerOrder[room.startPlayerIndex] ?? null,
      removedHazards: { ...room.removedHazards },
      currentRound: room.currentRound
        ? {
            ...room.currentRound,
            path: [...room.currentRound.path],
            decisions: { ...room.currentRound.decisions },
            revealDecisions: room.currentRound.revealDecisions
              ? { ...room.currentRound.revealDecisions }
              : null,
            hazardsSeen: { ...room.currentRound.hazardsSeen },
            remainingDeck: {
              ...room.currentRound.remainingDeck,
              hazards: { ...room.currentRound.remainingDeck.hazards }
            }
          }
        : null,
      transitionEndsAt: room.transitionEndsAt,
      winnerIds: [...room.winnerIds],
      log: [...room.log],
      updatedAt: room.updatedAt
    };
  }

  private notify(room: RoomState): void {
    emitRoomUpdate(room.roomId, this.toClientRoom(room));
  }

  private trailId(room: RoomState): string {
    const index = room.currentRound ? room.currentRound.path.length + 1 : 1;
    return `${room.roundNumber}-${index}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private clearTimer(roomId: string): void {
    const existing = this.nextRoundTimers.get(roomId);

    if (existing) {
      clearTimeout(existing);
      this.nextRoundTimers.delete(roomId);
    }
  }

  private clearDecisionRevealTimer(roomId: string): void {
    const existing = this.decisionRevealTimers.get(roomId);

    if (existing) {
      clearTimeout(existing);
      this.decisionRevealTimers.delete(roomId);
    }
  }

  private scheduleDecisionReveal(roomId: string): void {
    this.clearDecisionRevealTimer(roomId);

    const timer = setTimeout(() => {
      const room = this.getRoomById(roomId);

      if (!room || room.phase !== "in_round" || !room.currentRound?.revealDecisions) {
        return;
      }

      this.resolveTurn(room);
      this.notify(room);
    }, DECISION_REVEAL_MS);

    this.decisionRevealTimers.set(roomId, timer);
  }

  private scheduleNextRound(roomId: string): void {
    this.clearTimer(roomId);

    const timer = setTimeout(() => {
      const room = this.getRoomById(roomId);

      if (!room || room.phase !== "round_end") {
        return;
      }

      this.beginRound(room);
      this.notify(room);
    }, ROUND_TRANSITION_MS);

    this.nextRoundTimers.set(roomId, timer);
  }

  private resetForNewGame(room: RoomState): void {
    this.clearTimer(room.roomId);
    this.clearDecisionRevealTimer(room.roomId);

    room.phase = "lobby";
    room.roundNumber = 0;
    room.startPlayerIndex = 0;
    room.removedHazards = makeHazardMap();
    room.artifactsIntroduced = 0;
    room.artifactsRemoved = 0;
    room.artifactsClaimed = 0;
    room.deck = [];
    room.currentRound = null;
    room.transitionEndsAt = null;
    room.winnerIds = [];

    for (const playerId of room.playerOrder) {
      const player = room.players[playerId];
      player.bankedGems = 0;
      player.roundGems = 0;
      player.artifacts = 0;
      player.artifactPoints = 0;
      player.inTemple = false;
      player.hasLeftRound = false;
    }
  }

  private beginRound(room: RoomState): void {
    room.roundNumber += 1;
    room.phase = "in_round";
    room.transitionEndsAt = null;

    for (const playerId of room.playerOrder) {
      const player = room.players[playerId];
      player.roundGems = 0;
      player.inTemple = true;
      player.hasLeftRound = false;
    }

    room.deck = this.buildDeck(room);
    room.currentRound = {
      number: room.roundNumber,
      path: [],
      pathLooseGems: 0,
      artifactsOnPath: 0,
      pendingDecision: false,
      decisions: {},
      revealDecisions: null,
      revealEndsAt: null,
      hazardsSeen: makeHazardMap(),
      deckCount: room.deck.length,
      remainingDeck: this.getRemainingDeck(room),
      bustHazard: null,
      lastDrawnCard: null
    };

    this.addLog(room, `Round ${room.roundNumber} begins.`);
    this.touch(room);
    this.drawCard(room);
  }

  private awardArtifacts(room: RoomState, player: PlayerState, count: number): number {
    let points = 0;

    for (let i = 0; i < count; i += 1) {
      room.artifactsClaimed += 1;
      const value = ARTIFACT_VALUES[room.artifactsClaimed - 1] ?? 10;
      player.artifactPoints += value;
      player.artifacts += 1;
      room.artifactsRemoved += 1;
      points += value;
    }

    return points;
  }

  private bankAndExit(room: RoomState, leaverIds: string[], reason: string): void {
    const round = room.currentRound;

    if (!round || leaverIds.length === 0) {
      return;
    }

    const sharedLooseGems = Math.floor(round.pathLooseGems / leaverIds.length);
    round.pathLooseGems %= leaverIds.length;

    for (const playerId of leaverIds) {
      const player = room.players[playerId];
      player.bankedGems += player.roundGems + sharedLooseGems;
      player.roundGems = 0;
      player.inTemple = false;
      player.hasLeftRound = true;
    }

    if (leaverIds.length === 1 && round.artifactsOnPath > 0) {
      const player = room.players[leaverIds[0]];
      const gained = this.awardArtifacts(room, player, round.artifactsOnPath);
      this.addLog(
        room,
        `${player.name} claimed ${round.artifactsOnPath} artifact(s) worth ${gained} points.`
      );
      round.artifactsOnPath = 0;
    }

    const names = leaverIds.map((playerId) => room.players[playerId].name).join(", ");
    this.addLog(room, `${names} left the temple (${reason}).`);
  }

  private drawCard(room: RoomState): void {
    const round = room.currentRound;

    if (!round || room.phase !== "in_round") {
      return;
    }

    const activePlayerIds = this.getActivePlayerIds(room);

    if (activePlayerIds.length === 0) {
      this.endRound(room, "all_left");
      return;
    }

    if (room.deck.length === 0) {
      this.bankAndExit(room, activePlayerIds, "no cards left");
      this.endRound(room, "deck_empty");
      return;
    }

    const card = room.deck.pop() as DeckCard;
    let pathCard: TrailCard;

    if (card.kind === "treasure") {
      const share = Math.floor(card.value / activePlayerIds.length);
      const leftover = card.value % activePlayerIds.length;

      for (const playerId of activePlayerIds) {
        room.players[playerId].roundGems += share;
      }

      round.pathLooseGems += leftover;
      pathCard = {
        id: this.trailId(room),
        kind: "treasure",
        value: card.value,
        leftover
      };

      this.addLog(room, `Treasure ${card.value} revealed.`);
    } else if (card.kind === "artifact") {
      round.artifactsOnPath += 1;
      pathCard = {
        id: this.trailId(room),
        kind: "artifact"
      };
      this.addLog(room, "An artifact appears on the path.");
    } else {
      round.hazardsSeen[card.hazard] += 1;
      pathCard = {
        id: this.trailId(room),
        kind: "hazard",
        hazard: card.hazard
      };
      this.addLog(room, `Hazard revealed: ${card.hazard}.`);
    }

    round.path.push(pathCard);
    round.lastDrawnCard = pathCard;
    round.deckCount = room.deck.length;
    round.remainingDeck = this.getRemainingDeck(room);

    if (card.kind === "hazard" && round.hazardsSeen[card.hazard] >= 2) {
      round.bustHazard = card.hazard;
      this.endRound(room, "hazard_bust", card.hazard);
      return;
    }

    round.pendingDecision = true;
    round.decisions = {};
    round.revealDecisions = null;
    round.revealEndsAt = null;
    this.touch(room);
  }

  private resolveTurn(room: RoomState): void {
    const round = room.currentRound;

    if (!round || !round.revealDecisions) {
      return;
    }

    const decisions = round.revealDecisions;
    const activePlayerIds = Object.keys(decisions);
    const decisionSummary = activePlayerIds
      .map((playerId) => {
        const player = room.players[playerId];
        const decision = decisions[playerId];
        return `${player.name}: ${decision}`;
      })
      .join(" | ");
    const leaverIds = activePlayerIds.filter(
      (playerId) => decisions[playerId] === "leave"
    );

    this.clearDecisionRevealTimer(room.roomId);

    if (decisionSummary) {
      this.addLog(room, `Decisions locked: ${decisionSummary}`);
    }

    round.pendingDecision = false;
    round.decisions = {};
    round.revealDecisions = null;
    round.revealEndsAt = null;

    if (leaverIds.length > 0) {
      this.bankAndExit(room, leaverIds, "voluntary retreat");
    }

    if (this.getActivePlayerIds(room).length === 0) {
      this.endRound(room, "all_left");
      return;
    }

    this.drawCard(room);
  }

  private finalizeGame(room: RoomState): void {
    room.phase = "finished";
    room.transitionEndsAt = null;

    let bestTotal = -1;
    let bestArtifacts = -1;
    const winnerIds: string[] = [];

    for (const playerId of room.playerOrder) {
      const player = room.players[playerId];
      const total = player.bankedGems + player.artifactPoints;

      if (total > bestTotal) {
        bestTotal = total;
        bestArtifacts = player.artifacts;
        winnerIds.length = 0;
        winnerIds.push(playerId);
      } else if (total === bestTotal) {
        if (player.artifacts > bestArtifacts) {
          bestArtifacts = player.artifacts;
          winnerIds.length = 0;
          winnerIds.push(playerId);
        } else if (player.artifacts === bestArtifacts) {
          winnerIds.push(playerId);
        }
      }
    }

    room.winnerIds = winnerIds;
    this.addLog(room, "Final scores revealed.");
    this.touch(room);
  }

  private endRound(room: RoomState, reason: EndReason, hazard?: HazardType): void {
    const round = room.currentRound;

    if (!round) {
      return;
    }

    this.clearDecisionRevealTimer(room.roomId);

    round.pendingDecision = false;
    round.decisions = {};
    round.revealDecisions = null;
    round.revealEndsAt = null;

    if (reason === "hazard_bust" && hazard) {
      const activePlayers = this.getActivePlayerIds(room);

      for (const playerId of activePlayers) {
        const player = room.players[playerId];
        player.roundGems = 0;
        player.inTemple = false;
        player.hasLeftRound = true;
      }

      room.removedHazards[hazard] += 1;
      this.addLog(
        room,
        `Second ${hazard} card! Expedition busts and one ${hazard} card is removed from the game.`
      );
    }

    if (round.artifactsOnPath > 0) {
      room.artifactsRemoved += round.artifactsOnPath;
      this.addLog(
        room,
        `${round.artifactsOnPath} unclaimed artifact(s) were lost forever.`
      );
      round.artifactsOnPath = 0;
    }

    round.pathLooseGems = 0;

    if (room.roundNumber >= TOTAL_ROUNDS) {
      this.finalizeGame(room);
      this.notify(room);
      return;
    }

    room.phase = "round_end";
    room.transitionEndsAt = now() + ROUND_TRANSITION_MS;
    room.startPlayerIndex = (room.startPlayerIndex + 1) % room.playerOrder.length;

    this.addLog(room, `Round ${room.roundNumber} ended (${reason.replace("_", " ")}).`);
    this.touch(room);
    this.scheduleNextRound(room.roomId);
    this.notify(room);
  }

  createRoom(playerName: string, playerId: string): ActionResult<ClientRoomState> {
    const name = sanitizeName(playerName);

    if (!name) {
      return this.fail("Enter a player name.");
    }

    if (!playerId.trim()) {
      return this.fail("Invalid player id.");
    }

    const roomId = createRoomCode(new Set(this.rooms.keys()));

    const room: RoomState = {
      roomId,
      hostId: playerId,
      phase: "lobby",
      playerOrder: [playerId],
      players: {
        [playerId]: {
          id: playerId,
          name,
          color: PLAYER_COLORS[0],
          bankedGems: 0,
          roundGems: 0,
          artifacts: 0,
          artifactPoints: 0,
          inTemple: false,
          hasLeftRound: false
        }
      },
      roundNumber: 0,
      startPlayerIndex: 0,
      removedHazards: makeHazardMap(),
      artifactsIntroduced: 0,
      artifactsRemoved: 0,
      artifactsClaimed: 0,
      deck: [],
      currentRound: null,
      transitionEndsAt: null,
      winnerIds: [],
      log: ["Room created."],
      updatedAt: now()
    };

    this.rooms.set(roomId, room);
    const data = this.toClientRoom(room);
    this.notify(room);
    return this.ok(data);
  }

  joinRoom(
    roomId: string,
    playerName: string,
    playerId: string
  ): ActionResult<ClientRoomState> {
    const room = this.getRoomById(roomId);
    const name = sanitizeName(playerName);

    if (!room) {
      return this.fail("Room not found.");
    }

    if (!name) {
      return this.fail("Enter a player name.");
    }

    if (!playerId.trim()) {
      return this.fail("Invalid player id.");
    }

    const existing = room.players[playerId];

    if (existing) {
      existing.name = name;
      this.addLog(room, `${name} rejoined.`);
      this.touch(room);
      this.notify(room);
      return this.ok(this.toClientRoom(room));
    }

    if (room.phase !== "lobby") {
      return this.fail("Game already started. Rejoin with your existing player id.");
    }

    if (room.playerOrder.length >= MAX_PLAYERS) {
      return this.fail("Room is full.");
    }

    room.playerOrder.push(playerId);
    room.players[playerId] = {
      id: playerId,
      name,
      color: PLAYER_COLORS[(room.playerOrder.length - 1) % PLAYER_COLORS.length],
      bankedGems: 0,
      roundGems: 0,
      artifacts: 0,
      artifactPoints: 0,
      inTemple: false,
      hasLeftRound: false
    };

    this.addLog(room, `${name} joined the room.`);
    this.touch(room);
    this.notify(room);
    return this.ok(this.toClientRoom(room));
  }

  getRoom(roomId: string): ActionResult<ClientRoomState> {
    const room = this.getRoomById(roomId);

    if (!room) {
      return this.fail("Room not found.");
    }

    return this.ok(this.toClientRoom(room));
  }

  startGame(roomId: string, playerId: string): ActionResult<ClientRoomState> {
    const room = this.getRoomById(roomId);

    if (!room) {
      return this.fail("Room not found.");
    }

    if (room.hostId !== playerId) {
      return this.fail("Only the host can start the game.");
    }

    if (room.playerOrder.length < MIN_PLAYERS) {
      return this.fail("At least 2 players are required.");
    }

    if (room.phase === "in_round" || room.phase === "round_end") {
      return this.fail("Game is already in progress.");
    }

    this.clearTimer(room.roomId);
    this.clearDecisionRevealTimer(room.roomId);
    this.resetForNewGame(room);
    this.addLog(room, "A new expedition begins.");
    this.beginRound(room);
    this.notify(room);

    return this.ok(this.toClientRoom(room));
  }

  submitDecision(
    roomId: string,
    playerId: string,
    decision: PlayerDecision
  ): ActionResult<ClientRoomState> {
    const room = this.getRoomById(roomId);

    if (!room) {
      return this.fail("Room not found.");
    }

    if (room.phase !== "in_round" || !room.currentRound) {
      return this.fail("Round is not accepting decisions right now.");
    }

    const player = room.players[playerId];

    if (!player) {
      return this.fail("Player not found in this room.");
    }

    if (!player.inTemple) {
      return this.fail("You already left this round.");
    }

    if (!room.currentRound.pendingDecision) {
      return this.fail("Decision window is closed.");
    }

    if (room.currentRound.decisions[playerId]) {
      return this.fail("Decision already submitted.");
    }

    room.currentRound.decisions[playerId] = decision;

    const activePlayers = this.getActivePlayerIds(room);
    const everyoneDecided = activePlayers.every(
      (id) => room.currentRound?.decisions[id]
    );

    this.touch(room);

    if (everyoneDecided) {
      room.currentRound.pendingDecision = false;
      room.currentRound.revealDecisions = { ...room.currentRound.decisions };
      room.currentRound.revealEndsAt = now() + DECISION_REVEAL_MS;
      this.scheduleDecisionReveal(room.roomId);
    }

    this.notify(room);
    return this.ok(this.toClientRoom(room));
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __templeGoldRushStore: GameStore | undefined;
}

export const gameStore = global.__templeGoldRushStore ?? new GameStore();

global.__templeGoldRushStore = gameStore;
