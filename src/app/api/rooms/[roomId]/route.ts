import { NextResponse } from "next/server";

import { gameStore } from "@/lib/server/game-store";

interface RouteContext {
  params: Promise<{ roomId: string }>;
}

export async function GET(
  _: Request,
  { params }: RouteContext
): Promise<Response> {
  const { roomId } = await params;
  const result = gameStore.getRoom(roomId);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result.data);
}
