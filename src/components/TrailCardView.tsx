"use client";

import { CardBack, CardFront } from "@/components/cards";
import type { TrailCard } from "@/lib/game/types";

export function TrailCardView({ card }: { card: TrailCard }): React.JSX.Element {
  return (
    <article className="temple-card animate-popIn">
      <div className="temple-card-inner">
        <div className="temple-card-face temple-card-back">
          <CardBack />
        </div>
        <div className="temple-card-face temple-card-front">
          <CardFront card={card} />
        </div>
      </div>
    </article>
  );
}
