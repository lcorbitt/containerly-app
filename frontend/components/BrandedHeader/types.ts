import type { ReactNode } from "react";

export interface BrandedHeaderProps {
  organizationName: string;
  organizationImageUrl?: string | null;
  /** Small label below the organization name (e.g. "Customer portal"). */
  eyebrow?: string;
  actions?: ReactNode;
  /** `embedded` — top strip inside a parent card (no separate border/shadow). */
  variant?: "card" | "embedded";
}
