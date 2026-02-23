"use client";

import { useState } from "react";

import type { ClientRoomState } from "@/lib/game/types";

export function RoomHeader({
  room,
  onLeaveRoom
}: {
  room: ClientRoomState;
  onLeaveRoom: () => void;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(room.roomId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="rounded-3xl border border-canyon-200 bg-white/85 p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-canyon-700">Room</p>
          <h2 className="text-2xl font-bold text-jungle-900">{room.roomId}</h2>
          <p className="text-sm text-jungle-700">
            Round {room.roundNumber || 0} of {room.totalRounds} - {room.playerOrder.length} players
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-xl border border-jungle-700/30 bg-jungle-700/10 px-4 py-2 text-sm font-semibold text-jungle-800 transition hover:bg-jungle-700/20"
            onClick={() => {
              void handleCopy();
            }}
            type="button"
          >
            {copied ? "Copied" : "Copy Code"}
          </button>
          <button
            className="rounded-xl border border-canyon-300 bg-canyon-50 px-4 py-2 text-sm font-semibold text-canyon-800 transition hover:bg-canyon-100"
            onClick={onLeaveRoom}
            type="button"
          >
            Leave Room
          </button>
        </div>
      </div>
    </section>
  );
}
