"use client";

interface LobbyPanelProps {
  hostName: string;
  isBusy: boolean;
  isHost: boolean;
  isStarting: boolean;
  minPlayers: number;
  playerCount: number;
  onStartGame: () => void;
}

export function LobbyPanel({
  hostName,
  isBusy,
  isHost,
  isStarting,
  minPlayers,
  playerCount,
  onStartGame
}: LobbyPanelProps): React.JSX.Element {
  return (
    <>
      <h3 className="text-xl font-bold text-jungle-900">Lobby</h3>
      <p className="mt-2 text-sm text-jungle-700">
        Waiting for players. Host can start once at least 2 explorers are ready.
      </p>
      {isHost ? (
        <button
          className="mt-4 rounded-xl bg-jungle-800 px-4 py-2 font-semibold text-white transition hover:bg-jungle-900 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={playerCount < minPlayers || isBusy}
          onClick={onStartGame}
          type="button"
        >
          {isStarting ? "Starting..." : "Start Game"}
        </button>
      ) : (
        <p className="mt-4 rounded-xl bg-canyon-50 px-3 py-2 text-sm text-canyon-800">
          Waiting for {hostName} to start the expedition.
        </p>
      )}
    </>
  );
}
