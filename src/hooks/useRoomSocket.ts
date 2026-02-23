"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";

import type { ClientRoomState } from "@/lib/game/types";

interface UseRoomSocketParams {
  roomId: string | null;
  onRoomUpdate: (room: ClientRoomState) => void;
}

export function useRoomSocket({ roomId, onRoomUpdate }: UseRoomSocketParams): void {
  useEffect(() => {
    if (!roomId) {
      return;
    }

    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"]
    });

    const subscribe = (): void => {
      socket.emit("room:subscribe", { roomId });
    };

    socket.on("connect", subscribe);
    socket.on("room:update", onRoomUpdate);

    subscribe();

    return () => {
      socket.emit("room:unsubscribe", { roomId });
      socket.off("connect", subscribe);
      socket.off("room:update", onRoomUpdate);
      socket.disconnect();
    };
  }, [roomId, onRoomUpdate]);
}
