"use client";

import clsx from "clsx";

import { CornerPip } from "@/components/cards/CornerPip";
import { HazardCenter } from "@/components/cards/HazardCenter";
import { HAZARD_STYLE } from "@/components/cards/hazard-style";
import type { TrailCard } from "@/lib/game/types";

export function HazardCardFront({
  card
}: {
  card: Extract<TrailCard, { kind: "hazard" }>;
}): React.JSX.Element {
  const style = HAZARD_STYLE[card.hazard];

  return (
    <div
      className={clsx(
        "h-full rounded-[1rem] border border-black/10 bg-gradient-to-b p-3",
        style.frameClass
      )}
    >
      <div className="grid grid-cols-2">
        <CornerPip label={style.short} />
        <div className="justify-self-end">
          <CornerPip label={style.short} />
        </div>
      </div>
      <div className="flex h-[calc(100%-4.5rem)] items-center justify-center">
        <HazardCenter hazard={card.hazard} />
      </div>
      <div className="grid grid-cols-2 items-end">
        <CornerPip label={style.short} mirrored />
        <div className="justify-self-end">
          <CornerPip label={style.short} mirrored />
        </div>
      </div>
    </div>
  );
}
