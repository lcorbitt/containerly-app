import type { BillingCycle, PricingTier } from "./types";

interface DisplayPrice {
  /** Formatted price string, e.g. "$39", "$0", or "Custom". */
  amount: string;
  /** Whether the price is a numeric currency value (vs. a custom label). */
  isNumeric: boolean;
}

export function getDisplayPrice(tier: PricingTier, cycle: BillingCycle): DisplayPrice {
  if (tier.customPriceLabel) {
    return { amount: tier.customPriceLabel, isNumeric: false };
  }

  const price = cycle === "annual" ? tier.annualPrice : tier.monthlyPrice;
  if (price === null) {
    return { amount: tier.customPriceLabel ?? "Custom", isNumeric: false };
  }

  return { amount: formatUsd(price), isNumeric: true };
}

export function getAnnualSavingsPercent(tier: PricingTier): number | null {
  if (tier.monthlyPrice === null || tier.annualPrice === null || tier.monthlyPrice <= 0) {
    return null;
  }
  return Math.round(((tier.monthlyPrice - tier.annualPrice) / tier.monthlyPrice) * 100);
}

export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US")}`;
}
