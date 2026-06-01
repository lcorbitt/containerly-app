import type { ReactNode } from "react";

export interface RevealProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  durationMs?: number;
  /** Keep children mounted when hidden (opacity fade only). Use for tab panels to avoid layout shift. */
  keepMounted?: boolean;
}
