import type { CSSProperties, ReactNode } from "react";

export interface RevealProps {
  /** When `whenInView` is set, `show` is ignored. */
  show?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  durationMs?: number;
  /** Keep children mounted when hidden (opacity fade only). Use for tab panels to avoid layout shift. */
  keepMounted?: boolean;
  /**
   * Reveal when this much of the element intersects the viewport (default 10%).
   * Stays revealed after first trigger (scroll-up does not hide).
   */
  whenInView?: boolean;
  inViewThreshold?: number;
  inViewRootMargin?: string;
}
