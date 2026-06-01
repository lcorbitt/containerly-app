import type { CSSProperties, ReactNode } from "react";

export interface RevealProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  durationMs?: number;
  /** Keep children mounted when hidden (opacity fade only). Use for tab panels to avoid layout shift. */
  keepMounted?: boolean;
}
