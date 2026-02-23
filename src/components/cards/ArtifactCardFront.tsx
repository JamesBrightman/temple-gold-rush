"use client";

import { ArtifactIcon } from "@/assets/cards";
import { CornerPip } from "@/components/cards/CornerPip";

export function ArtifactCardFront(): React.JSX.Element {
  return (
    <div className="h-full rounded-[1rem] border border-amber-700/30 bg-gradient-to-b from-yellow-50 via-amber-100 to-canyon-200 p-3">
      <div className="grid grid-cols-2">
        <CornerPip label="A" />
        <div className="justify-self-end">
          <CornerPip label="A" />
        </div>
      </div>
      <div className="flex h-[calc(100%-4.5rem)] items-center justify-center">
        <ArtifactIcon />
      </div>
      <div className="grid grid-cols-2 items-end">
        <CornerPip label="A" mirrored />
        <div className="justify-self-end">
          <CornerPip label="A" mirrored />
        </div>
      </div>
    </div>
  );
}
