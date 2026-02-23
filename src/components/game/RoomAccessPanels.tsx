"use client";

interface RoomAccessPanelsProps {
  createPending: boolean;
  isBusy: boolean;
  joinCode: string;
  joinPending: boolean;
  onCreateSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onJoinCodeChange: (value: string) => void;
  onJoinSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  ready: boolean;
}

export function RoomAccessPanels({
  createPending,
  isBusy,
  joinCode,
  joinPending,
  onCreateSubmit,
  onJoinCodeChange,
  onJoinSubmit,
  ready
}: RoomAccessPanelsProps): React.JSX.Element {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <form
        className="rounded-3xl border border-jungle-700/20 bg-white/85 p-5 shadow-panel"
        onSubmit={onCreateSubmit}
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
          {createPending ? "Creating..." : "Create Expedition"}
        </button>
      </form>

      <form
        className="rounded-3xl border border-canyon-200 bg-white/85 p-5 shadow-panel"
        onSubmit={onJoinSubmit}
      >
        <h2 className="text-xl font-bold text-jungle-900">Join Room</h2>
        <p className="mt-1 text-sm text-jungle-700">Enter a room code from your group.</p>
        <input
          className="mt-4 w-full rounded-xl border border-canyon-300 bg-canyon-50 px-3 py-2 text-center text-lg font-semibold tracking-[0.2em] text-jungle-900 outline-none transition focus:border-jungle-700 focus:bg-white"
          maxLength={5}
          onChange={(event) => onJoinCodeChange(event.target.value.toUpperCase())}
          placeholder="ABCDE"
          value={joinCode}
        />
        <button
          className="mt-4 rounded-xl bg-canyon-700 px-4 py-2 font-semibold text-white transition hover:bg-canyon-800 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={!ready || isBusy}
          type="submit"
        >
          {joinPending ? "Joining..." : "Join Expedition"}
        </button>
      </form>
    </section>
  );
}
