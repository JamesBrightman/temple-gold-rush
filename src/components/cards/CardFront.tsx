"use client";

import { ArtifactCardFront } from "@/components/cards/ArtifactCardFront";
import { HazardCardFront } from "@/components/cards/HazardCardFront";
import { TreasureCardFront } from "@/components/cards/TreasureCardFront";
import type { TrailCard } from "@/lib/game/types";

export function CardFront({ card }: { card: TrailCard }): React.JSX.Element {
  if (card.kind === "treasure") {
    return <TreasureCardFront card={card} />;
  }

  if (card.kind === "hazard") {
    return <HazardCardFront card={card} />;
  }

  return <ArtifactCardFront />;
}
