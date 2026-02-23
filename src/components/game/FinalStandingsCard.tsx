"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import type { PlayerState } from "@/lib/game/types";

interface FinalStandingsCardProps {
  playerOrder: string[];
  players: Record<string, PlayerState>;
  winnerIds: string[];
}

interface StandingRow {
  id: string;
  name: string;
  total: number;
  artifacts: number;
}

type PodiumRank = 1 | 2 | 3;

function formatArtifacts(value: number): string {
  return value === 1 ? "1 artifact" : `${value} artifacts`;
}

function CupBadge({ rank }: { rank: PodiumRank }): React.JSX.Element {
  const stylesByRank: Record<PodiumRank, { label: string; className: string }> = {
    1: {
      label: "Gold cup",
      className: "border-amber-500 bg-amber-100 text-amber-700"
    },
    2: {
      label: "Silver cup",
      className: "border-slate-400 bg-slate-100 text-slate-600"
    },
    3: {
      label: "Bronze cup",
      className: "border-orange-500 bg-orange-100 text-orange-700"
    }
  };

  const style = stylesByRank[rank];

  return (
    <span
      aria-label={style.label}
      className={clsx(
        "inline-flex h-7 w-7 items-center justify-center rounded-full border",
        style.className
      )}
      title={style.label}
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 2h10v2h2a1 1 0 0 1 1 1v2a6 6 0 0 1-5 5.91V15a3 3 0 0 1-2 2.83V20h4v2H7v-2h4v-2.17A3 3 0 0 1 9 15v-2.09A6 6 0 0 1 4 7V5a1 1 0 0 1 1-1h2V2Zm-1 4v1a4 4 0 0 0 3 3.87V6H6Zm12 0v4.87A4 4 0 0 0 21 7V6h-3Z" />
      </svg>
    </span>
  );
}

export function FinalStandingsCard({
  playerOrder,
  players,
  winnerIds
}: FinalStandingsCardProps): React.JSX.Element {
  const standings = useMemo(() => {
    const rows: StandingRow[] = playerOrder
      .map((id) => players[id])
      .filter(Boolean)
      .map((player) => ({
        id: player.id,
        name: player.name,
        total: player.bankedGems + player.artifactPoints,
        artifacts: player.artifacts
      }));

    return rows.sort((a, b) => {
      const byTotal = b.total - a.total;

      if (byTotal !== 0) {
        return byTotal;
      }

      return b.artifacts - a.artifacts;
    });
  }, [playerOrder, players]);

  const [revealedCount, setRevealedCount] = useState(0);

  const standingsSignature = useMemo(
    () => standings.map((row) => `${row.id}:${row.total}:${row.artifacts}`).join("|"),
    [standings]
  );

  useEffect(() => {
    if (standings.length === 0) {
      setRevealedCount(0);
      return;
    }

    setRevealedCount(0);

    const timer = window.setInterval(() => {
      setRevealedCount((current) => {
        if (current >= standings.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, 520);

    return () => window.clearInterval(timer);
  }, [standings.length, standingsSignature]);

  const minVisibleIndex = Math.max(standings.length - revealedCount, 0);

  return (
    <section className="rounded-3xl border border-canyon-200 bg-white/90 p-5 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-jungle-900">Final standings</h3>
        </div>
      </div>

      <ol className="mt-4 space-y-2">
        {standings.map((row, index) => {
          const isRevealed = index >= minVisibleIndex;
          const isWinner = winnerIds.includes(row.id);
          const cupRank = index + 1;
          const hasCup = cupRank <= 3;

          return (
            <li
              className={clsx(
                "rounded-xl border px-3 py-2",
                isRevealed
                  ? clsx(
                      "leaderboard-row-reveal bg-white",
                      isWinner ? "border-canyon-500 bg-canyon-50/60" : "border-canyon-200"
                    )
                  : "border-canyon-200 bg-canyon-50/70"
              )}
              key={row.id}
            >
              {isRevealed ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {hasCup ? (
                      <CupBadge rank={cupRank as PodiumRank} />
                    ) : (
                      <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-jungle-700/10 px-2 text-sm font-bold text-jungle-900">
                        #{index + 1}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-jungle-900">{row.name}</p>
                      <p className="text-sm text-jungle-700">{formatArtifacts(row.artifacts)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-canyon-700">Score</p>
                    <p className="text-2xl font-extrabold leading-none text-canyon-900">
                      {row.total}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[3rem] rounded-lg bg-canyon-100/75" />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
