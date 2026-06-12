import type { SignupWizardStep } from "./types";

export const SIGNUP_ORGANIZATION_ID_STORAGE_KEY = "containerly_signup_organization_id";

export function parseSignupStep(raw: string | undefined): SignupWizardStep {
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  return 1;
}

export function signupStepHref(step: SignupWizardStep): string {
  return step === 1 ? "/signup" : `/signup?step=${step}`;
}

export function readStoredSignupOrganizationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(SIGNUP_ORGANIZATION_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeSignupOrganizationId(organizationId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SIGNUP_ORGANIZATION_ID_STORAGE_KEY, organizationId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredSignupOrganizationId(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SIGNUP_ORGANIZATION_ID_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
