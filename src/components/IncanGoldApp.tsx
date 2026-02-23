"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";

import { FinalStandingsCard } from "@/components/game/FinalStandingsCard";
import { PlayerRow } from "@/components/game/PlayerRow";
import { RoomHeader } from "@/components/game/RoomHeader";
import { joinRoom, createRoom, getRoom, startGame, submitDecision } from "@/lib/client-api";
import { TrailCardView } from "@/components/TrailCardView";
import { HAZARD_TYPES } from "@/lib/game/constants";
import type {
  HazardType,
  ClientRoomState,
  PlayerDecision
} from "@/lib/game/types";
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity";
import { useRoomSocket } from "@/hooks/useRoomSocket";

const ROOM_STORAGE_KEY = "temple-gold-rush-room-id";
const INCAN_GOLD_RULES_URL =
  "https://themindcafe.com.sg/wp-content/uploads/2018/02/Incan-Gold.pdf";

const HAZARD_META: Record<HazardType, { label: string; tone: string }> = {
  spiders: { label: "Spiders", tone: "bg-rose-100 text-rose-700" },
  snakes: { label: "Snakes", tone: "bg-amber-100 text-amber-700" },
  mummy: { label: "Mummies", tone: "bg-stone-200 text-stone-700" },
  fire: { label: "Fire", tone: "bg-orange-100 text-orange-700" },
  rockfall: { label: "Rockfall", tone: "bg-slate-200 text-slate-700" }
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Action failed.";
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function IncanGoldApp(): React.JSX.Element {
  const queryClient = useQueryClient();
  const { playerId, playerName, setPlayerName, ready } = usePlayerIdentity();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isActivityOpen, setIsActivityOpen] = useState(true);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const savedRoom = window.localStorage.getItem(ROOM_STORAGE_KEY);

    if (savedRoom) {
      setRoomId(savedRoom);
      setJoinCode(savedRoom);
    }
  }, [ready]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 400);

    return () => clearInterval(timer);
  }, []);

  const saveRoom = useCallback((nextRoomId: string | null): void => {
    setRoomId(nextRoomId);

    if (!nextRoomId) {
      window.localStorage.removeItem(ROOM_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ROOM_STORAGE_KEY, nextRoomId);
  }, []);

  const roomQuery = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId as string),
    enabled: Boolean(roomId),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });

  const handleRoomUpdate = useCallback(
    (room: ClientRoomState): void => {
      queryClient.setQueryData(["room", room.roomId], room);
    },
    [queryClient]
  );

  useRoomSocket({ roomId, onRoomUpdate: handleRoomUpdate });

  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
      setJoinCode(room.roomId);
      saveRoom(room.roomId);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const joinRoomMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
      setJoinCode(room.roomId);
      saveRoom(room.roomId);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const startGameMutation = useMutation({
    mutationFn: startGame,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const decisionMutation = useMutation({
    mutationFn: submitDecision,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const room = roomQuery.data ?? null;
  const me = room && playerId ? room.players[playerId] : undefined;
  const round = room?.currentRound;

  const activeDecisionState = useMemo(() => {
    if (!room || !round || !me) {
      return { canDecide: false, myDecision: null as PlayerDecision | null };
    }

    const myDecision = round.decisions[playerId] ?? round.revealDecisions?.[playerId] ?? null;

    return {
      canDecide: room.phase === "in_round" && round.pendingDecision && me.inTemple && !myDecision,
      myDecision
    };
  }, [room, round, me, playerId]);

  const turnNumber = round?.path.length ?? 0;
  const roundGemTotal =
    round?.path.reduce((total, card) => {
      if (card.kind !== "treasure") {
        return total;
      }

      return total + card.value;
    }, 0) ?? 0;
  const roundDeckSize = round ? round.deckCount + round.path.length : 0;
  const artifactsInPlay = round
    ? round.remainingDeck.artifact + round.artifactsOnPath
    : 0;

  const revealPlayerIds = useMemo(() => {
    if (!room || !round?.revealDecisions) {
      return [] as string[];
    }

    return room.playerOrder.filter((id) => Boolean(round.revealDecisions?.[id]));
  }, [room, round]);

  const waitingOnPlayerIds = useMemo(() => {
    if (!room || !round || room.phase !== "in_round" || !round.pendingDecision) {
      return [] as string[];
    }

    return room.playerOrder.filter((id) => {
      const player = room.players[id];

      if (!player?.inTemple) {
        return false;
      }

      return !round.decisions[id];
    });
  }, [room, round]);

  const waitingOnPlayerSet = useMemo(() => new Set(waitingOnPlayerIds), [waitingOnPlayerIds]);

  const spectatorOdds = useMemo(() => {
    if (!room || !round || !me) {
      return null;
    }

    if (room.phase !== "in_round" || me.inTemple || !me.hasLeftRound) {
      return null;
    }

    const totalCards = round.remainingDeck.total;

    if (totalCards <= 0) {
      return null;
    }

    const hazards = HAZARD_TYPES.map((hazard) => {
      const count = round.remainingDeck.hazards[hazard];
      return {
        hazard,
        count,
        probability: count / totalCards
      };
    });

    const bustCards = hazards.reduce((sum, item) => {
      const hazardSeenBefore = round.hazardsSeen[item.hazard] > 0;
      return hazardSeenBefore ? sum + item.count : sum;
    }, 0);

    const bustChance = bustCards / totalCards;
    const safeContinueChance = 1 - bustChance;

    return {
      totalCards,
      treasureProbability: round.remainingDeck.treasure / totalCards,
      artifactProbability: round.remainingDeck.artifact / totalCards,
      hazards,
      bustChance,
      safeContinueChance,
      recommendation: safeContinueChance >= 0.5 ? "continue" : "leave"
    };
  }, [room, round, me]);

  const transitionSeconds =
    room?.transitionEndsAt && room.phase === "round_end"
      ? Math.max(0, Math.ceil((room.transitionEndsAt - nowMs) / 1000))
      : null;

  const isBusy =
    createRoomMutation.isPending ||
    joinRoomMutation.isPending ||
    startGameMutation.isPending ||
    decisionMutation.isPending;

  const clearRoom = (): void => {
    setFeedback(null);
    saveRoom(null);
  };

  const handleCreateRoom = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!playerId) {
      return;
    }

    const name = playerName.trim();

    if (!name) {
      setFeedback("Enter your name before creating a room.");
      return;
    }

    createRoomMutation.mutate({
      playerName: name,
      playerId
    });
  };

  const handleJoinRoom = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();

    if (!playerId) {
      return;
    }

    const name = playerName.trim();

    if (!name) {
      setFeedback("Enter your name before joining.");
      return;
    }

    const code = joinCode.trim().toUpperCase();

    if (!code) {
      setFeedback("Enter a room code.");
      return;
    }

    joinRoomMutation.mutate({
      roomId: code,
      playerName: name,
      playerId
    });
  };

  const submitDecisionAction = (decision: PlayerDecision): void => {
    if (!room || !playerId) {
      return;
    }

    decisionMutation.mutate({
      roomId: room.roomId,
      playerId,
      decision
    });
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 p-4 pb-8 md:p-8">
      <header className="rounded-3xl border border-jungle-700/20 bg-white/80 p-5 shadow-panel md:p-6">
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.02em] text-jungle-700">
              Multiplayer Incan Gold
            </p>
            <h1 className="mt-2 text-3xl font-bold text-jungle-900 md:text-4xl">Temple Gold Rush</h1>
            <p className="mt-2 max-w-2xl text-sm text-jungle-800 md:text-base">
              2-8 players, 5 rounds, shared decisions each turn, live sync across devices.
            </p>
            <a
              className="mt-3 inline-flex rounded-xl border border-jungle-700/30 bg-jungle-700/10 px-4 py-2 text-sm font-semibold text-jungle-800 transition hover:bg-jungle-700/20"
              href={INCAN_GOLD_RULES_URL}
              rel="noopener noreferrer"
              target="_blank"
            >
              View Incan Gold Rules
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border border-canyon-200 shadow-sm">
            <Image
              alt="Stylized temple entrance"
              className="h-auto w-full"
              height={320}
              priority
              src="/temple-hero.svg"
              width={640}
            />
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-canyon-200 bg-white/85 p-4 shadow-panel md:p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <label className="text-sm font-semibold text-canyon-700" htmlFor="player-name">
            Your Name
          </label>
          <input
            className="w-full rounded-xl border border-canyon-300 bg-canyon-50 px-3 py-2 text-jungle-900 outline-none transition focus:border-jungle-700 focus:bg-white md:max-w-sm"
            id="player-name"
            maxLength={20}
            onChange={(event) => setPlayerName(event.target.value)}
            placeholder="Explorer name"
            value={playerName}
          />
        </div>
      </section>

      {!roomId && (
        <section className="grid gap-4 md:grid-cols-2">
          <form
            className="rounded-3xl border border-jungle-700/20 bg-white/85 p-5 shadow-panel"
            onSubmit={handleCreateRoom}
          >
            <h2 className="text-xl font-bold text-jungle-900">Create Room</h2>
            <p className="mt-1 text-sm text-jungle-700">
              Start a new table and share the 5-character code.
            </p>
            <button
              className="mt-5 rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!ready || isBusy}
              type="submit"
            >
              {createRoomMutation.isPending ? "Creating..." : "Create Expedition"}
            </button>
          </form>

          <form
            className="rounded-3xl border border-canyon-200 bg-white/85 p-5 shadow-panel"
            onSubmit={handleJoinRoom}
          >
            <h2 className="text-xl font-bold text-jungle-900">Join Room</h2>
            <p className="mt-1 text-sm text-jungle-700">Enter a room code from your group.</p>
            <input
              className="mt-4 w-full rounded-xl border border-canyon-300 bg-canyon-50 px-3 py-2 text-center text-lg font-semibold tracking-[0.2em] text-jungle-900 outline-none transition focus:border-jungle-700 focus:bg-white"
              maxLength={5}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="ABCDE"
              value={joinCode}
            />
            <button
              className="mt-4 rounded-xl bg-canyon-700 px-4 py-2 font-semibold text-white transition hover:bg-canyon-800 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={!ready || isBusy}
              type="submit"
            >
              {joinRoomMutation.isPending ? "Joining..." : "Join Expedition"}
            </button>
          </form>
        </section>
      )}

      {feedback && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {feedback}
        </section>
      )}

      {roomId && roomQuery.isLoading && (
        <section className="rounded-2xl border border-canyon-200 bg-white/85 p-5 text-jungle-800 shadow-panel">
          Loading room...
        </section>
      )}

      {roomId && roomQuery.error && !room && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
          <p>{getErrorMessage(roomQuery.error)}</p>
          <button
            className="mt-3 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700"
            onClick={clearRoom}
            type="button"
          >
            Clear Room
          </button>
        </section>
      )}

      {room && (
        <>
          <RoomHeader onLeaveRoom={clearRoom} room={room} />
          {room.phase === "finished" ? (
            <section className="space-y-4">
              <article className="rounded-3xl border border-canyon-200 bg-white/90 p-4 shadow-panel">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-jungle-900">Game finished.</p>
                  {room.hostId === playerId ? (
                    <button
                      className="rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:opacity-55"
                      disabled={isBusy}
                      onClick={() =>
                        startGameMutation.mutate({ roomId: room.roomId, playerId })
                      }
                      type="button"
                    >
                      {startGameMutation.isPending ? "Starting..." : "New Expedition"}
                    </button>
                  ) : (
                    <p className="text-sm text-jungle-700">
                      Waiting for {room.players[room.hostId]?.name} to start a new expedition.
                    </p>
                  )}
                </div>
              </article>

              <FinalStandingsCard
                playerOrder={room.playerOrder}
                players={room.players}
                winnerIds={room.winnerIds}
              />
            </section>
          ) : (
            <>

          {room.phase !== "lobby" && round && (
            <section className="rounded-3xl border border-jungle-700/20 bg-gradient-to-r from-jungle-900 to-jungle-800 p-4 text-white shadow-panel md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold tracking-[0.04em] text-canyon-200">
                    Turn Tracker
                  </p>
                  <p className="mt-2 text-5xl font-extrabold leading-none md:text-6xl">{turnNumber}</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-sm text-canyon-100">Round</p>
                  <p className="text-xl font-bold">
                    {room.roundNumber} / {room.totalRounds}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="space-y-3">
              {room.phase !== "lobby" && round && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-canyon-900 bg-gradient-to-b from-canyon-700 to-canyon-800 px-4 py-3 text-center text-canyon-50 shadow-md">
                    <p className="text-sm font-semibold">Deck</p>
                    <p className="mt-1 text-2xl font-extrabold leading-none">{roundDeckSize}</p>
                    <p className="mt-1 text-sm font-semibold">Artifacts: {artifactsInPlay}</p>
                  </div>
                  <div className="flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-canyon-900 bg-gradient-to-b from-canyon-600 to-canyon-700 px-4 py-3 text-center text-canyon-50 shadow-md">
                    <p className="text-sm font-semibold">Round Gems</p>
                    <p className="mt-1 text-2xl font-extrabold leading-none">{roundGemTotal}</p>
                  </div>
                  <div className="flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-canyon-900 bg-gradient-to-b from-canyon-500 to-canyon-700 px-4 py-3 text-center text-canyon-50 shadow-md">
                    <p className="text-sm font-semibold">Loose Gems</p>
                    <p className="mt-1 text-2xl font-extrabold leading-none">{round.pathLooseGems}</p>
                  </div>
                  <div className="flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-jungle-900 bg-gradient-to-b from-jungle-700 to-jungle-900 px-4 py-3 text-center text-canyon-50 shadow-md">
                    <p className="text-sm font-semibold">Artifacts on path</p>
                    <p className="mt-1 text-2xl font-extrabold leading-none">{round.artifactsOnPath}</p>
                  </div>
                </div>
              )}

              <article className="self-start rounded-3xl border border-canyon-200 bg-white/90 p-5 shadow-panel">
              {room.phase === "lobby" && (
                <>
                  <h3 className="text-xl font-bold text-jungle-900">Lobby</h3>
                  <p className="mt-2 text-sm text-jungle-700">
                    Waiting for players. Host can start once at least 2 explorers are ready.
                  </p>
                  {room.hostId === playerId && (
                    <button
                      className="mt-4 rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:cursor-not-allowed disabled:opacity-55"
                      disabled={room.playerOrder.length < room.minPlayers || isBusy}
                      onClick={() =>
                        startGameMutation.mutate({ roomId: room.roomId, playerId })
                      }
                      type="button"
                    >
                      {startGameMutation.isPending ? "Starting..." : "Start Game"}
                    </button>
                  )}
                  {room.hostId !== playerId && (
                    <p className="mt-4 rounded-xl bg-canyon-50 px-3 py-2 text-sm text-canyon-800">
                      Waiting for {room.players[room.hostId]?.name} to start the expedition.
                    </p>
                  )}
                </>
              )}

              {room.phase !== "lobby" && round && (
                <>
                  <h3 className="text-xl font-bold text-jungle-900">Temple Path</h3>

                  <div className="mt-4 card-grid">
                    {round.path.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-canyon-300 bg-canyon-50/60 p-4 text-sm text-canyon-700">
                        No cards revealed yet.
                      </div>
                    )}
                    {round.path.map((card) => (
                      <TrailCardView card={card} key={card.id} />
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-canyon-200 bg-canyon-50/75 p-4">
                    {room.phase === "in_round" && round.pendingDecision && (
                      <>
                        <p className="text-sm font-semibold text-jungle-900">Choose your action</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <button
                            className="rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:cursor-not-allowed disabled:opacity-55"
                            disabled={!activeDecisionState.canDecide || isBusy}
                            onClick={() => submitDecisionAction("continue")}
                            type="button"
                          >
                            Continue
                          </button>
                          <button
                            className="rounded-xl bg-canyon-700 px-4 py-2 font-semibold text-white transition hover:bg-canyon-800 disabled:cursor-not-allowed disabled:opacity-55"
                            disabled={!activeDecisionState.canDecide || isBusy}
                            onClick={() => submitDecisionAction("leave")}
                            type="button"
                          >
                            Leave Temple
                          </button>
                        </div>
                        {!me?.inTemple && (
                          <p className="mt-3 text-sm text-jungle-700">
                            You already left this round. Waiting for others.
                          </p>
                        )}
                        {activeDecisionState.myDecision && (
                          <p className="mt-3 text-sm text-jungle-700">
                            You chose: {activeDecisionState.myDecision}
                          </p>
                        )}
                      </>
                    )}

                    {room.phase === "in_round" && round.revealDecisions && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-jungle-900">Reveal</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {revealPlayerIds.map((id, index) => {
                            const player = room.players[id];
                            const decision = round.revealDecisions?.[id];
                            const isLeave = decision === "leave";

                            return (
                              <article
                                className={clsx(
                                  "decision-reveal-card rounded-xl border px-3 py-3",
                                  isLeave
                                    ? "border-canyon-400 bg-canyon-50"
                                    : "border-jungle-700/40 bg-jungle-700/10"
                                )}
                                key={id}
                                style={{ animationDelay: `${index * 110}ms` }}
                              >
                                <p className="text-sm font-semibold text-jungle-900">{player.name}</p>
                                <p
                                  className={clsx(
                                    "mt-1 text-sm font-semibold",
                                    isLeave ? "text-canyon-800" : "text-jungle-800"
                                  )}
                                >
                                  {isLeave ? "Leave" : "Continue"}
                                </p>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {room.phase === "round_end" && (
                      <p className="text-sm font-semibold text-jungle-900">
                        Next round starts in {transitionSeconds ?? 0}s...
                      </p>
                    )}

                  </div>

                  {spectatorOdds && (
                    <div className="mt-4 rounded-2xl border border-jungle-700/25 bg-jungle-900/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-jungle-700">
                            Live Risk Radar
                          </p>
                          <p className="text-sm text-jungle-800">
                            You are out this round. Odds below are for the next draw.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-jungle-800">
                          {spectatorOdds.totalCards} cards remain
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-sm text-canyon-700">Gems</p>
                          <p className="font-semibold text-canyon-900">
                            {formatPercent(spectatorOdds.treasureProbability)}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-3 py-2">
                          <p className="text-sm text-canyon-700">Artifact</p>
                          <p className="font-semibold text-canyon-900">
                            {formatPercent(spectatorOdds.artifactProbability)}
                          </p>
                        </div>
                        {spectatorOdds.hazards.map((item) => (
                          <div className="rounded-xl bg-white px-3 py-2" key={item.hazard}>
                            <p className="text-sm text-canyon-700">
                              {HAZARD_META[item.hazard].label}
                            </p>
                            <p className="font-semibold text-canyon-900">
                              {formatPercent(item.probability)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl border border-canyon-300 bg-canyon-50 px-3 py-2 text-sm text-jungle-900">
                        <p>
                          Bust chance next draw: <strong>{formatPercent(spectatorOdds.bustChance)}</strong>
                        </p>
                        <p>
                          Survive chance next draw:{" "}
                          <strong>{formatPercent(spectatorOdds.safeContinueChance)}</strong>
                        </p>
                        <p className="mt-1">
                          Recommendation (maximize odds of seeing one more card):{" "}
                          <strong className="capitalize">{spectatorOdds.recommendation}</strong>
                        </p>
                      </div>
                    </div>
                  )}

                </>
              )}

              </article>
            </div>

            <aside className="space-y-4">
              <article className="rounded-3xl border border-canyon-200 bg-white/90 p-4 shadow-panel">
                <h3 className="text-lg font-bold text-jungle-900">Explorers</h3>
                <ul className="mt-3 space-y-3">
                  {room.playerOrder.map((id) => {
                    const player = room.players[id];

                    return (
                      <PlayerRow
                        isHost={room.hostId === id}
                        isMe={id === playerId}
                        isWaitingDecision={waitingOnPlayerSet.has(id)}
                        isWinner={room.winnerIds.includes(id)}
                        key={id}
                        player={player}
                      />
                    );
                  })}
                </ul>
              </article>

              <article className="rounded-3xl border border-canyon-200 bg-white/90 p-4 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-jungle-900">Activity log</h3>
                  <button
                    aria-expanded={isActivityOpen}
                    aria-label={isActivityOpen ? "Collapse activity log" : "Expand activity log"}
                    className="rounded-md p-1 text-2xl leading-none text-black transition hover:opacity-70"
                    onClick={() => setIsActivityOpen((current) => !current)}
                    title={isActivityOpen ? "Collapse activity" : "Expand activity"}
                    type="button"
                  >
                    {isActivityOpen ? "\u2191" : "\u2193"}
                  </button>
                </div>

                {isActivityOpen ? (
                  <ul className="mt-3 max-h-[24rem] space-y-2 overflow-y-auto pr-1 text-sm text-jungle-800">
                    {room.log.length === 0 && <li>No events yet.</li>}
                    {room.log.map((entry, index) => (
                      <li className="rounded-lg bg-canyon-50 px-3 py-2" key={`${entry}-${index}`}>
                        {entry}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </aside>
          </section>

            </>
          )}
        </>
      )}
    </main>
  );
}
