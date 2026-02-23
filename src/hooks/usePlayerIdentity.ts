"use client";

import { useEffect, useMemo, useState } from "react";

const PLAYER_ID_KEY = "temple-gold-rush-player-id";
const PLAYER_NAME_KEY = "temple-gold-rush-player-name";

function makePlayerId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `player-${Math.random().toString(36).slice(2, 10)}`;
}

export function usePlayerIdentity(): {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  ready: boolean;
} {
  const [ready, setReady] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerNameState] = useState("");

  useEffect(() => {
    let id = window.localStorage.getItem(PLAYER_ID_KEY) ?? "";

    if (!id) {
      id = makePlayerId();
      window.localStorage.setItem(PLAYER_ID_KEY, id);
    }

    setPlayerId(id);
    setPlayerNameState(window.localStorage.getItem(PLAYER_NAME_KEY) ?? "");
    setReady(true);
  }, []);

  const setPlayerName = useMemo(
    () => (value: string): void => {
      setPlayerNameState(value);
      window.localStorage.setItem(PLAYER_NAME_KEY, value);
    },
    []
  );

  return {
    playerId,
    playerName,
    setPlayerName,
    ready
  };
}
