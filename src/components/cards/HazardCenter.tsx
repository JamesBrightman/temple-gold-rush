"use client";

import {
  FireIcon,
  MummyIcon,
  RockfallIcon,
  SnakeIcon,
  SpiderIcon
} from "@/assets/cards";
import type { HazardType } from "@/lib/game/types";

export function HazardCenter({
  hazard
}: {
  hazard: HazardType;
}): React.JSX.Element {
  if (hazard === "fire") {
    return <FireIcon />;
  }

  if (hazard === "spiders") {
    return <SpiderIcon />;
  }

  if (hazard === "snakes") {
    return <SnakeIcon />;
  }

  if (hazard === "mummy") {
    return <MummyIcon />;
  }

  return <RockfallIcon />;
}
