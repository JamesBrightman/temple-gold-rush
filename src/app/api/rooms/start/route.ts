import { NextResponse } from "next/server";
import { z } from "zod";

import { gameStore } from "@/lib/server/game-store";

const startSchema = z.object({
  roomId: z.string(),
  playerId: z.string()
});

export async function POST(request: Request): Promise<Response> {
  const payload = startSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const result = gameStore.startGame(payload.data.roomId, payload.data.playerId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
