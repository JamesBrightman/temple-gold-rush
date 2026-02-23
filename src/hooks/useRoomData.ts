"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getRoom } from "@/lib/client-api";
import type { ClientRoomState } from "@/lib/game/types";
import { useRoomSocket } from "@/hooks/useRoomSocket";

export function useRoomQuery(roomId: string | null) {
  return useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId as string),
    enabled: Boolean(roomId),
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  });
}

export function useRoomRealtimeSync(roomId: string | null): void {
  const queryClient = useQueryClient();

  const handleRoomUpdate = useCallback(
    (room: ClientRoomState): void => {
      queryClient.setQueryData(["room", room.roomId], room);
    },
    [queryClient]
  );

  useRoomSocket({ roomId, onRoomUpdate: handleRoomUpdate });
}
