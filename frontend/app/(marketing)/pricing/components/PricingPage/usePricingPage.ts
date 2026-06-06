import { useState } from "react";
import type { BillingCycle } from "./types";

interface UsePricingPageResult {
  billingCycle: BillingCycle;
  setBillingCycle: (cycle: BillingCycle) => void;
}

export function usePricingPage(): UsePricingPageResult {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("annual");

  return { billingCycle, setBillingCycle };
}
