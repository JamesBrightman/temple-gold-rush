import type { ClientRoomState, PlayerDecision } from "@/lib/game/types";

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const data = (await response.json()) as T | { error?: string };

  if (!response.ok) {
    const message = (data as { error?: string }).error ?? "Request failed.";
    throw new Error(message);
  }

  return data as T;
}

export function createRoom(payload: {
  playerName: string;
  playerId: string;
}): Promise<ClientRoomState> {
  return requestJson<ClientRoomState>("/api/rooms/create", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function joinRoom(payload: {
  roomId: string;
  playerName: string;
  playerId: string;
}): Promise<ClientRoomState> {
  return requestJson<ClientRoomState>("/api/rooms/join", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getRoom(roomId: string): Promise<ClientRoomState> {
  return requestJson<ClientRoomState>(`/api/rooms/${roomId}`);
}

export function startGame(payload: {
  roomId: string;
  playerId: string;
}): Promise<ClientRoomState> {
  return requestJson<ClientRoomState>("/api/rooms/start", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function submitDecision(payload: {
  roomId: string;
  playerId: string;
  decision: PlayerDecision;
}): Promise<ClientRoomState> {
  return requestJson<ClientRoomState>("/api/rooms/decide", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
