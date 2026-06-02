"use client";

import {
  REVEAL_DURATION_MS,
  REVEAL_EASE_CLASS,
  REVEAL_HIDDEN_CLASS,
  REVEAL_VISIBLE_CLASS,
} from "./constants";
import type { RevealProps } from "./types";
import { REVEAL_IN_VIEW_THRESHOLD } from "./constants";
import { useReveal } from "./useReveal";
import { useRevealInView } from "./useRevealInView";

export function Reveal({
  show = false,
  children,
  className,
  style,
  durationMs = REVEAL_DURATION_MS,
  keepMounted = false,
  whenInView = false,
  inViewThreshold = REVEAL_IN_VIEW_THRESHOLD,
  inViewRootMargin,
}: RevealProps) {
  const { ref, inView } = useRevealInView({
    threshold: inViewThreshold,
    rootMargin: inViewRootMargin,
    enabled: whenInView,
  });
  const effectiveShow = whenInView ? inView : show;
  const { mounted, visible } = useReveal(effectiveShow, durationMs, keepMounted || whenInView);

  if (!keepMounted && !whenInView && !mounted) return null;

  const isShown = keepMounted || whenInView ? effectiveShow && visible : visible;

  return (
    <div
      ref={whenInView ? ref : undefined}
      className={`transition-opacity ${REVEAL_EASE_CLASS} motion-reduce:transition-none motion-reduce:duration-0 ${isShown ? REVEAL_VISIBLE_CLASS : REVEAL_HIDDEN_CLASS}${className ? ` ${className}` : ""}`}
      style={{ transitionDuration: `${durationMs}ms`, ...style }}
      aria-hidden={!effectiveShow}
    >
      {children}
    </div>
  );
}
