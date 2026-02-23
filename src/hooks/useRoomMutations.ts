"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createRoom, joinRoom, startGame, submitDecision } from "@/lib/client-api";

interface UseRoomMutationsParams {
  saveRoom: (roomId: string | null) => void;
  setFeedback: (value: string | null) => void;
  setJoinCode: (value: string) => void;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Action failed.";
}

export function useRoomMutations({
  saveRoom,
  setFeedback,
  setJoinCode
}: UseRoomMutationsParams) {
  const queryClient = useQueryClient();

  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
      setJoinCode(room.roomId);
      saveRoom(room.roomId);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const joinRoomMutation = useMutation({
    mutationFn: joinRoom,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
      setJoinCode(room.roomId);
      saveRoom(room.roomId);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const startGameMutation = useMutation({
    mutationFn: startGame,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const decisionMutation = useMutation({
    mutationFn: submitDecision,
    onSuccess: (room) => {
      setFeedback(null);
      queryClient.setQueryData(["room", room.roomId], room);
    },
    onError: (error) => setFeedback(getErrorMessage(error))
  });

  const isBusy =
    createRoomMutation.isPending ||
    joinRoomMutation.isPending ||
    startGameMutation.isPending ||
    decisionMutation.isPending;

  return {
    createRoomMutation,
    joinRoomMutation,
    startGameMutation,
    decisionMutation,
    isBusy
  };
}
