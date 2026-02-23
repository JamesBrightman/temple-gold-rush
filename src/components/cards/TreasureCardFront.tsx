"use client";

import { GemPip } from "@/assets/cards";
import { CornerPip } from "@/components/cards/CornerPip";
import type { TrailCard } from "@/lib/game/types";

export function TreasureCardFront({
  card
}: {
  card: Extract<TrailCard, { kind: "treasure" }>;
}): React.JSX.Element {
  return (
    <div className="h-full rounded-[1rem] border border-canyon-300 bg-gradient-to-b from-canyon-50 via-white to-canyon-100 p-3">
      <div className="grid grid-cols-2">
        <CornerPip label={card.value} />
        <div className="justify-self-end">
          <CornerPip label={card.value} />
        </div>
      </div>
      <div className="mt-1 flex h-[calc(100%-4.5rem)] items-center justify-center">
        <div className="flex w-full max-w-[8.6rem] flex-wrap items-center justify-center gap-1.5">
          {Array.from({ length: card.value }).map((_, index) => (
            <div className="flex h-5 w-5 items-center justify-center" key={index}>
              <GemPip />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 items-end">
        <CornerPip label={card.value} mirrored />
        <div className="justify-self-end">
          <CornerPip label={card.value} mirrored />
        </div>
      </div>
    </div>
  );
}
