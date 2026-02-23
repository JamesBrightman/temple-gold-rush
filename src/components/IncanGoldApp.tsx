"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

import { ActivityLogPanel } from "@/components/game/ActivityLogPanel";
import { FinalStandingsCard } from "@/components/game/FinalStandingsCard";
import { FinishedGamePanel } from "@/components/game/FinishedGamePanel";
import { LobbyPanel } from "@/components/game/LobbyPanel";
import { PlayerRow } from "@/components/game/PlayerRow";
import { RoomAccessPanels } from "@/components/game/RoomAccessPanels";
import { RoomHeader } from "@/components/game/RoomHeader";
import { RoundStatChips } from "@/components/game/RoundStatChips";
import {
  SpectatorOddsPanel,
  type SpectatorOdds,
} from "@/components/game/SpectatorOddsPanel";
import { TurnTrackerBanner } from "@/components/game/TurnTrackerBanner";
import { TrailCardView } from "@/components/TrailCardView";
import { HAZARD_TYPES } from "@/lib/game/constants";
import type { PlayerDecision } from "@/lib/game/types";
import { usePlayerIdentity } from "@/hooks/usePlayerIdentity";
import { useRoomQuery, useRoomRealtimeSync } from "@/hooks/useRoomData";
import { getErrorMessage, useRoomMutations } from "@/hooks/useRoomMutations";

const ROOM_STORAGE_KEY = "temple-gold-rush-room-id";
const INCAN_GOLD_RULES_URL =
  "https://themindcafe.com.sg/wp-content/uploads/2018/02/Incan-Gold.pdf";

export function IncanGoldApp(): React.JSX.Element {
  const { playerId, playerName, setPlayerName, ready } = usePlayerIdentity();

  const [roomId, setRoomId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isActivityOpen, setIsActivityOpen] = useState(false);

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

  const roomQuery = useRoomQuery(roomId);
  useRoomRealtimeSync(roomId);

  const {
    createRoomMutation,
    joinRoomMutation,
    startGameMutation,
    decisionMutation,
    isBusy,
  } = useRoomMutations({
    saveRoom,
    setFeedback,
    setJoinCode,
  });

  const room = roomQuery.data ?? null;
  const me = room && playerId ? room.players[playerId] : undefined;
  const round = room?.currentRound;

  const activeDecisionState = useMemo(() => {
    if (!room || !round || !me) {
      return { canDecide: false, myDecision: null as PlayerDecision | null };
    }

    const myDecision =
      round.decisions[playerId] ?? round.revealDecisions?.[playerId] ?? null;

    return {
      canDecide:
        room.phase === "in_round" &&
        round.pendingDecision &&
        me.inTemple &&
        !myDecision,
      myDecision,
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

    return room.playerOrder.filter((id) =>
      Boolean(round.revealDecisions?.[id]),
    );
  }, [room, round]);

  const waitingOnPlayerIds = useMemo(() => {
    if (
      !room ||
      !round ||
      room.phase !== "in_round" ||
      !round.pendingDecision
    ) {
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

  const waitingOnPlayerSet = useMemo(
    () => new Set(waitingOnPlayerIds),
    [waitingOnPlayerIds],
  );

  const spectatorOdds = useMemo<SpectatorOdds | null>(() => {
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
        probability: count / totalCards,
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
      recommendation: safeContinueChance >= 0.5 ? "continue" : "leave",
    };
  }, [room, round, me]);

  const transitionSeconds =
    room?.transitionEndsAt && room.phase === "round_end"
      ? Math.max(0, Math.ceil((room.transitionEndsAt - nowMs) / 1000))
      : null;

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
      playerId,
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
      playerId,
    });
  };

  const submitDecisionAction = (decision: PlayerDecision): void => {
    if (!room || !playerId) {
      return;
    }

    decisionMutation.mutate({
      roomId: room.roomId,
      playerId,
      decision,
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
            <h1 className="mt-2 text-3xl font-bold text-jungle-900 md:text-4xl">
              Temple Gold Rush
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-jungle-800 md:text-base">
              2-8 players, 5 rounds, shared decisions each turn, live sync
              across devices.
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
          <label
            className="text-sm font-semibold text-canyon-700"
            htmlFor="player-name"
          >
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
        <RoomAccessPanels
          createPending={createRoomMutation.isPending}
          isBusy={isBusy}
          joinCode={joinCode}
          joinPending={joinRoomMutation.isPending}
          onCreateSubmit={handleCreateRoom}
          onJoinCodeChange={setJoinCode}
          onJoinSubmit={handleJoinRoom}
          ready={ready}
        />
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
              <FinishedGamePanel
                hostName={room.players[room.hostId]?.name ?? "host"}
                isBusy={isBusy}
                isHost={room.hostId === playerId}
                isStarting={startGameMutation.isPending}
                onStartNewExpedition={() =>
                  startGameMutation.mutate({ roomId: room.roomId, playerId })
                }
              />

              <FinalStandingsCard
                playerOrder={room.playerOrder}
                players={room.players}
                winnerIds={room.winnerIds}
              />
            </section>
          ) : (
            <>
              {room.phase !== "lobby" && round && (
                <TurnTrackerBanner
                  roundNumber={room.roundNumber}
                  totalRounds={room.totalRounds}
                  turnNumber={turnNumber}
                />
              )}

              <section className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
                <div className="space-y-3">
                  {room.phase !== "lobby" && round && (
                    <RoundStatChips
                      artifactsInPlay={artifactsInPlay}
                      artifactsOnPath={round.artifactsOnPath}
                      roundDeckSize={roundDeckSize}
                      roundGemTotal={roundGemTotal}
                      roundLooseGems={round.pathLooseGems}
                    />
                  )}

                  <article className="self-start rounded-3xl border border-canyon-200 bg-white/90 p-5 shadow-panel">
                    {room.phase === "lobby" && (
                      <LobbyPanel
                        hostName={room.players[room.hostId]?.name ?? "host"}
                        isBusy={isBusy}
                        isHost={room.hostId === playerId}
                        isStarting={startGameMutation.isPending}
                        minPlayers={room.minPlayers}
                        onStartGame={() =>
                          startGameMutation.mutate({
                            roomId: room.roomId,
                            playerId,
                          })
                        }
                        playerCount={room.playerOrder.length}
                      />
                    )}

                    {room.phase !== "lobby" && round && (
                      <>
                        <h3 className="text-xl font-bold text-jungle-900">
                          Temple Path
                        </h3>

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
                          {room.phase === "in_round" &&
                            round.pendingDecision && (
                              <>
                                <p className="text-sm font-semibold text-jungle-900">
                                  Choose your action
                                </p>
                                <div className="mt-3 flex flex-wrap gap-3">
                                  <button
                                    className="rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:cursor-not-allowed disabled:opacity-55"
                                    disabled={
                                      !activeDecisionState.canDecide || isBusy
                                    }
                                    onClick={() =>
                                      submitDecisionAction("continue")
                                    }
                                    type="button"
                                  >
                                    Continue
                                  </button>
                                  <button
                                    className="rounded-xl bg-canyon-700 px-4 py-2 font-semibold text-white transition hover:bg-canyon-800 disabled:cursor-not-allowed disabled:opacity-55"
                                    disabled={
                                      !activeDecisionState.canDecide || isBusy
                                    }
                                    onClick={() =>
                                      submitDecisionAction("leave")
                                    }
                                    type="button"
                                  >
                                    Leave Temple
                                  </button>
                                </div>
                                {!me?.inTemple && (
                                  <p className="mt-3 text-sm text-jungle-700">
                                    You already left this round. Waiting for
                                    others.
                                  </p>
                                )}
                                {activeDecisionState.myDecision && (
                                  <p className="mt-3 text-sm text-jungle-700">
                                    You chose: {activeDecisionState.myDecision}
                                  </p>
                                )}
                              </>
                            )}

                          {room.phase === "in_round" &&
                            round.revealDecisions && (
                              <div className="mt-3">
                                <p className="text-sm font-semibold text-jungle-900">
                                  Reveal
                                </p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {revealPlayerIds.map((id, index) => {
                                    const player = room.players[id];
                                    const decision =
                                      round.revealDecisions?.[id];
                                    const isLeave = decision === "leave";

                                    return (
                                      <article
                                        className={clsx(
                                          "decision-reveal-card rounded-xl border px-3 py-3",
                                          isLeave
                                            ? "border-canyon-400 bg-canyon-50"
                                            : "border-jungle-700/40 bg-jungle-700/10",
                                        )}
                                        key={id}
                                        style={{
                                          animationDelay: `${index * 110}ms`,
                                        }}
                                      >
                                        <p className="text-sm font-semibold text-jungle-900">
                                          {player.name}
                                        </p>
                                        <p
                                          className={clsx(
                                            "mt-1 text-sm font-semibold",
                                            isLeave
                                              ? "text-canyon-800"
                                              : "text-jungle-800",
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

                        {spectatorOdds && <SpectatorOddsPanel odds={spectatorOdds} />}
                      </>
                    )}
                  </article>
                </div>

                <aside className="space-y-4">
                  <article className="rounded-3xl border border-canyon-200 bg-white/90 p-4 shadow-panel">
                    <h3 className="text-lg font-bold text-jungle-900">
                      Explorers
                    </h3>
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

                  <ActivityLogPanel
                    isOpen={isActivityOpen}
                    log={room.log}
                    onToggle={() => setIsActivityOpen((current) => !current)}
                  />
                </aside>
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}
