import type { LucideIcon } from "lucide-react";

export type BillingCycle = "monthly" | "annual";

export interface PricingTier {
  id: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  /** Monthly per-seat price in USD, billed monthly. `null` for custom/contact tiers. */
  monthlyPrice: number | null;
  /** Monthly per-seat price in USD when billed annually. `null` for custom/contact tiers. */
  annualPrice: number | null;
  /** Label shown instead of a numeric price (e.g. "Custom"). */
  customPriceLabel?: string;
  /** Short unit shown beside numeric prices (e.g. "/ seat / mo"). */
  priceUnit: string;
  ctaLabel: string;
  ctaHref: string;
  highlighted: boolean;
  badge?: string;
  features: readonly string[];
}

export interface FeatureGroup {
  category: string;
  rows: readonly FeatureRow[];
}

export interface FeatureRow {
  label: string;
  /** Per-tier availability keyed by tier id. A string renders as text, boolean as check/dash. */
  values: Record<string, boolean | string>;
}

export interface FaqItem {
  question: string;
  answer: string;
}
