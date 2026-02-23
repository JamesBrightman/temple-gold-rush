"use client";

interface RoundStatChipsProps {
  artifactsInPlay: number;
  artifactsOnPath: number;
  roundDeckSize: number;
  roundGemTotal: number;
  roundLooseGems: number;
}

export function RoundStatChips({
  artifactsInPlay,
  artifactsOnPath,
  roundDeckSize,
  roundGemTotal,
  roundLooseGems
}: RoundStatChipsProps): React.JSX.Element {
  return (
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
        <p className="mt-1 text-2xl font-extrabold leading-none">{roundLooseGems}</p>
      </div>
      <div className="flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-jungle-900 bg-gradient-to-b from-jungle-700 to-jungle-900 px-4 py-3 text-center text-canyon-50 shadow-md">
        <p className="text-sm font-semibold">Artifacts on path</p>
        <p className="mt-1 text-2xl font-extrabold leading-none">{artifactsOnPath}</p>
      </div>
    </div>
  );
}
