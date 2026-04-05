"use client";

import { X } from "lucide-react";

const toneStyles = {
  /** Light modal headers (app shell, forms). */
  default:
    "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
  /** Dark chrome (e.g. black / zinc-900 dialog headers). */
  inverse: "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
} as const;

export type DialogCloseButtonTone = keyof typeof toneStyles;

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
