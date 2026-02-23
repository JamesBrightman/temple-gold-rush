"use client";

interface ActivityLogPanelProps {
  isOpen: boolean;
  log: string[];
  onToggle: () => void;
}

export function ActivityLogPanel({
  isOpen,
  log,
  onToggle
}: ActivityLogPanelProps): React.JSX.Element {
  return (
    <article className="rounded-3xl border border-canyon-200 bg-white/90 p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-jungle-900">Activity log</h3>
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse activity log" : "Expand activity log"}
          className="rounded-md p-1 text-2xl leading-none text-black transition hover:opacity-70"
          onClick={onToggle}
          title={isOpen ? "Collapse activity" : "Expand activity"}
          type="button"
        >
          {isOpen ? "\u2191" : "\u2193"}
        </button>
      </div>

      {isOpen ? (
        <ul className="mt-3 max-h-[24rem] space-y-2 overflow-y-auto pr-1 text-sm text-jungle-800">
          {log.length === 0 && <li>No events yet.</li>}
          {log.map((entry, index) => (
            <li className="rounded-lg bg-canyon-50 px-3 py-2" key={`${entry}-${index}`}>
              {entry}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
