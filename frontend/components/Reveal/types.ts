import type { ReactNode } from "react";

export interface RevealProps {
  show: boolean;
  children: ReactNode;
  className?: string;
  durationMs?: number;
}
