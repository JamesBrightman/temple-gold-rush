"use client";

interface TurnTrackerBannerProps {
  roundNumber: number;
  totalRounds: number;
  turnNumber: number;
}

export function TurnTrackerBanner({
  roundNumber,
  totalRounds,
  turnNumber
}: TurnTrackerBannerProps): React.JSX.Element {
  return (
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
            {roundNumber} / {totalRounds}
          </p>
        </div>
      </div>
    </section>
  );
}
