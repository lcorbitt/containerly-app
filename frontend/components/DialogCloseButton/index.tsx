"use client";

import { X } from "lucide-react";

import { toneStyles } from "./constants";
import type { DialogCloseButtonTone } from "./types";

export type { DialogCloseButtonTone } from "./types";

type DialogCloseButtonProps = {
  onClick: () => void;
  tone?: DialogCloseButtonTone;
  className?: string;
  "aria-label"?: string;
};

/**
 * Single reusable dismiss control for modals/dialogs: Lucide X, fixed hit target, top-right of header rows.
 */
export function DialogCloseButton({
  onClick,
  tone = "default",
  className = "",
  "aria-label": ariaLabel = "Close",
}: DialogCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:focus-visible:ring-zinc-500/40 ${toneStyles[tone]} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <X className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
