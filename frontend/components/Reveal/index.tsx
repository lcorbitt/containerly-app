"use client";

import {
  REVEAL_DURATION_MS,
  REVEAL_EASE_CLASS,
  REVEAL_HIDDEN_CLASS,
  REVEAL_VISIBLE_CLASS,
} from "./constants";
import type { RevealProps } from "./types";
import { useReveal } from "./useReveal";

export function Reveal({
  show,
  children,
  className,
  style,
  durationMs = REVEAL_DURATION_MS,
  keepMounted = false,
}: RevealProps) {
  const { mounted, visible } = useReveal(show, durationMs, keepMounted);

  if (!keepMounted && !mounted) return null;

  const isShown = keepMounted ? show && visible : visible;

  return (
    <div
      className={`transition-opacity ${REVEAL_EASE_CLASS} motion-reduce:transition-none motion-reduce:duration-0 ${isShown ? REVEAL_VISIBLE_CLASS : REVEAL_HIDDEN_CLASS}${className ? ` ${className}` : ""}`}
      style={{ transitionDuration: `${durationMs}ms`, ...style }}
      aria-hidden={!show}
    >
      {children}
    </div>
  );
}
