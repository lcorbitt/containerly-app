import type { ReactNode } from "react";

export type TopNavVariant = "marketing" | "app";

export interface TopNavShellProps {
  variant: TopNavVariant;
  children: ReactNode;
  /** Optional row below the main bar (e.g. mobile breadcrumbs). */
  footer?: ReactNode;
}
