"use client";

export function CardBack(): React.JSX.Element {
  return (
    <div className="h-full rounded-[1rem] border border-canyon-900/40 bg-gradient-to-b from-jungle-800 via-jungle-900 to-black p-3">
      <div className="grid h-full place-items-center rounded-[0.85rem] border border-canyon-200/35 bg-[radial-gradient(circle_at_30%_20%,rgba(240,208,159,0.2),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(240,208,159,0.2),transparent_35%)]">
        <div className="rounded-full border border-canyon-300/50 bg-canyon-200/20 px-3 py-2 text-center">
          <p className="text-xs font-semibold tracking-[0.08em] text-canyon-100/90">
            Temple Gold
          </p>
          <p className="text-sm font-bold text-canyon-100">Rush</p>
        </div>
      </div>
    </div>
  );
}
