import type { ReactNode } from "react";

export type TopNavVariant = "marketing" | "app";

export interface TopNavShellProps {
  variant: TopNavVariant;
  children: ReactNode;
}
