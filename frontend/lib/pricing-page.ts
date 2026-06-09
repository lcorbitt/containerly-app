/** Pricing is hidden on production builds until launch. */
export function isPricingPageEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function withoutPricingLinks<T extends { href: string }>(links: readonly T[]): T[] {
  if (isPricingPageEnabled()) {
    return [...links];
  }

  return links.filter((link) => !link.href.startsWith("/pricing"));
}
