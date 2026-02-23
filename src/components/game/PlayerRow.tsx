"use client";

import clsx from "clsx";

import type { PlayerState } from "@/lib/game/types";

function totalScore(player: PlayerState): number {
  return player.bankedGems + player.artifactPoints;
}

function playerStatus(player: PlayerState): string {
  return player.inTemple ? "Still exploring" : player.hasLeftRound ? "Back at camp" : "Waiting";
}

export function PlayerRow({
  player,
  isMe,
  isHost,
  isWinner,
  isWaitingDecision
}: {
  player: PlayerState;
  isMe: boolean;
  isHost: boolean;
  isWinner: boolean;
  isWaitingDecision: boolean;
}): React.JSX.Element {
  const showWaitingChip = isWaitingDecision && player.inTemple;
  const showBackAtCampChip = player.hasLeftRound && !player.inTemple;

  return (
    <li
      className={clsx(
        "rounded-2xl border bg-white/85 p-4 shadow-sm",
        isMe ? "border-jungle-700 shadow-glow" : "border-canyon-200",
        isWinner ? "ring-2 ring-canyon-400" : ""
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-jungle-900">
            {player.name}
            {isMe ? " (You)" : ""}
          </p>
          {isMe && (
            <p className="text-sm text-jungle-700">
              {isHost ? "Host" : "Explorer"}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showWaitingChip && (
            <span className="waiting-chip inline-flex rounded-full border border-yellow-400 bg-yellow-300 px-2 py-0.5 text-sm font-bold text-yellow-900">
              Waiting
            </span>
          )}
          {showBackAtCampChip && (
            <span className="inline-flex rounded-full border border-canyon-300 bg-canyon-50 px-2 py-0.5 text-sm font-semibold text-canyon-800">
              Back at camp
            </span>
          )}
          <span
            className="inline-flex h-4 w-4 rounded-full border border-black/10"
            style={{ backgroundColor: player.color }}
          />
        </div>
      </div>
      {isMe && (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-canyon-50 px-2 py-1">
              <dt className="text-sm text-canyon-700">Safe</dt>
              <dd className="font-semibold text-canyon-900">{player.bankedGems}</dd>
            </div>
            <div className="rounded-lg bg-jungle-700/10 px-2 py-1">
              <dt className="text-sm text-jungle-700">Leaving now</dt>
              <dd className="font-semibold text-jungle-900">{player.roundGems}</dd>
            </div>
            <div className="rounded-lg bg-canyon-50 px-2 py-1">
              <dt className="text-sm text-canyon-700">Artifacts</dt>
              <dd className="font-semibold text-canyon-900">{player.artifacts}</dd>
            </div>
            <div className="rounded-lg bg-jungle-700/10 px-2 py-1">
              <dt className="text-sm text-jungle-700">Total</dt>
              <dd className="font-semibold text-jungle-900">{totalScore(player)}</dd>
            </div>
          </dl>
          {!showBackAtCampChip && (
            <p className="mt-2 text-sm text-jungle-700">
              {playerStatus(player)}
            </p>
          )}
        </>
      )}
      {!isMe && !showBackAtCampChip && <p className="mt-2 text-sm text-jungle-700">{playerStatus(player)}</p>}
    </li>
  );
}
