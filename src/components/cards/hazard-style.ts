import type { HazardType } from "@/lib/game/types";

export const HAZARD_STYLE: Record<
  HazardType,
  {
    short: string;
    frameClass: string;
  }
> = {
  spiders: {
    short: "Sp",
    frameClass: "from-rose-50 via-rose-100 to-rose-200"
  },
  snakes: {
    short: "Sn",
    frameClass: "from-amber-50 via-amber-100 to-amber-200"
  },
  mummy: {
    short: "M",
    frameClass: "from-stone-100 via-stone-200 to-stone-300"
  },
  fire: {
    short: "F",
    frameClass: "from-orange-50 via-orange-100 to-orange-200"
  },
  rockfall: {
    short: "R",
    frameClass: "from-slate-100 via-slate-200 to-slate-300"
  }
};
