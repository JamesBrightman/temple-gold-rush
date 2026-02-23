"use client";

import type { HazardType } from "@/lib/game/types";

const HAZARD_LABELS: Record<HazardType, string> = {
  spiders: "Spiders",
  snakes: "Snakes",
  mummy: "Mummies",
  fire: "Fire",
  rockfall: "Rockfall",
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export interface SpectatorOdds {
  artifactProbability: number;
  bustChance: number;
  hazards: Array<{ count: number; hazard: HazardType; probability: number }>;
  recommendation: "continue" | "leave";
  safeContinueChance: number;
  totalCards: number;
  treasureProbability: number;
}

interface SpectatorOddsPanelProps {
  odds: SpectatorOdds;
}

export function SpectatorOddsPanel({
  odds,
}: SpectatorOddsPanelProps): React.JSX.Element {
  return (
    <div className="mt-4 rounded-2xl border border-jungle-700/25 bg-jungle-900/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-jungle-700">Live Risk Radar</p>
          <p className="text-sm text-jungle-800">
            You are out this round. Odds below are for the next draw.
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-jungle-800">
          {odds.totalCards} cards remain
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded-xl bg-white px-3 py-2">
          <p className="text-sm text-canyon-700">Gems</p>
          <p className="font-semibold text-canyon-900">
            {formatPercent(odds.treasureProbability)}
          </p>
        </div>
        <div className="rounded-xl bg-white px-3 py-2">
          <p className="text-sm text-canyon-700">Artifact</p>
          <p className="font-semibold text-canyon-900">
            {formatPercent(odds.artifactProbability)}
          </p>
        </div>
        {odds.hazards.map((item) => (
          <div className="rounded-xl bg-white px-3 py-2" key={item.hazard}>
            <p className="text-sm text-canyon-700">{HAZARD_LABELS[item.hazard]}</p>
            <p className="font-semibold text-canyon-900">
              {formatPercent(item.probability)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-canyon-300 bg-canyon-50 px-3 py-2 text-sm text-jungle-900">
        <p>
          Bust chance next draw: <strong>{formatPercent(odds.bustChance)}</strong>
        </p>
        <p>
          Survive chance next draw:{" "}
          <strong>{formatPercent(odds.safeContinueChance)}</strong>
        </p>
        <p className="mt-1">
          Recommendation (maximize odds of seeing one more card):{" "}
          <strong className="capitalize">{odds.recommendation}</strong>
        </p>
      </div>
    </div>
  );
}
