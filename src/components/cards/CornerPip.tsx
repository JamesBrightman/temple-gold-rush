"use client";

import clsx from "clsx";

export function CornerPip({
  label,
  mirrored = false
}: {
  label: string | number;
  mirrored?: boolean;
}): React.JSX.Element {
  const compact = typeof label === "string" && label.length > 1;

  return (
    <span
      className={clsx(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 bg-white/85 font-extrabold text-jungle-900",
        compact ? "text-xs leading-none" : "text-sm",
        mirrored && "rotate-180"
      )}
    >
      {label}
    </span>
  );
}
