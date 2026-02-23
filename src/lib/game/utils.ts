import { ROOM_CODE_LENGTH } from "@/lib/game/constants";

const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function sanitizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 20);
}

export function createRoomCode(existing: Set<string>): string {
  let code = "";

  do {
    code = Array.from({ length: ROOM_CODE_LENGTH }, () =>
      ROOM_ALPHABET.charAt(Math.floor(Math.random() * ROOM_ALPHABET.length))
    ).join("");
  } while (existing.has(code));

  return code;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];

  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function now(): number {
  return Date.now();
}
