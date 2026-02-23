import type { Server as SocketIOServer } from "socket.io";

import type { ClientRoomState } from "@/lib/game/types";

declare global {
  // eslint-disable-next-line no-var
  var __templeIo: SocketIOServer | undefined;
}

export function getSocketServer(): SocketIOServer | null {
  return global.__templeIo ?? null;
}

export function roomChannel(roomId: string): string {
  return `room:${roomId}`;
}

export function emitRoomUpdate(roomId: string, room: ClientRoomState): void {
  const io = getSocketServer();

  if (!io) {
    return;
  }

  io.to(roomChannel(roomId)).emit("room:update", room);
}
