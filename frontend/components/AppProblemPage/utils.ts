import type { ProblemPageCta } from "./types";

export interface ProblemPageSessionHint {
  isCustomer: boolean;
}

export interface ProblemPageCtas {
  primaryCta: ProblemPageCta;
  secondaryCta?: ProblemPageCta;
}

export function getProblemPageCtas(session: ProblemPageSessionHint | null): ProblemPageCtas {
  if (!session) {
    return {
      primaryCta: { href: "/", label: "Back to home" },
      secondaryCta: { href: "/login", label: "Sign in" },
    };
  }

  if (session.isCustomer) {
    return {
      primaryCta: { href: "/my-shipments", label: "My shipments" },
    };
  }

  return {
    primaryCta: { href: "/dashboard", label: "Dashboard" },
    secondaryCta: { href: "/shipments", label: "Shipments" },
  };
}

export const OPERATOR_ERROR_CTAS: ProblemPageCtas = {
  primaryCta: { href: "/dashboard", label: "Dashboard" },
  secondaryCta: { href: "/shipments", label: "Shipments" },
};

export const CUSTOMER_ERROR_CTAS: ProblemPageCtas = {
  primaryCta: { href: "/my-shipments", label: "My shipments" },
};

export const PUBLIC_ERROR_CTAS: ProblemPageCtas = {
  primaryCta: { href: "/", label: "Back to home" },
  secondaryCta: { href: "/login", label: "Sign in" },
};
