"use client";

interface FinishedGamePanelProps {
  hostName: string;
  isBusy: boolean;
  isHost: boolean;
  isStarting: boolean;
  onStartNewExpedition: () => void;
}

export function FinishedGamePanel({
  hostName,
  isBusy,
  isHost,
  isStarting,
  onStartNewExpedition
}: FinishedGamePanelProps): React.JSX.Element {
  return (
    <article className="rounded-3xl border border-canyon-200 bg-white/90 p-4 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-jungle-900">Game finished.</p>
        {isHost ? (
          <button
            className="rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:opacity-55"
            disabled={isBusy}
            onClick={onStartNewExpedition}
            type="button"
          >
            {isStarting ? "Starting..." : "New Expedition"}
          </button>
        ) : (
          <p className="text-sm text-jungle-700">
            Waiting for {hostName} to start a new expedition.
          </p>
        )}
      </div>
    </article>
  );
}
