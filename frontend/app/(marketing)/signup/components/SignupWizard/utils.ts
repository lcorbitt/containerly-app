import type { SignupAccountDraft, SignupDraft, SignupWizardStep } from "./types";

export const SIGNUP_DRAFT_STORAGE_KEY = "containerly_signup_draft";

/** Serializable draft slice persisted across refresh (password stays in memory only). */
interface StoredSignupDraft {
  account: Omit<SignupAccountDraft, "password"> | null;
  organization: SignupDraft["organization"];
  invites: SignupDraft["invites"];
}

export function emptySignupDraft(): SignupDraft {
  return { account: null, organization: null, invites: [] };
}

export function parseSignupStep(raw: string | undefined): SignupWizardStep {
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  return 1;
}

export function signupStepHref(step: SignupWizardStep): string {
  return step === 1 ? "/signup" : `/signup?step=${step}`;
}

export function readStoredSignupDraft(): StoredSignupDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIGNUP_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSignupDraft;
  } catch {
    return null;
  }
}

export function writeStoredSignupDraft(draft: SignupDraft): void {
  if (typeof window === "undefined") return;
  const stored: StoredSignupDraft = {
    account: draft.account
      ? {
          fullName: draft.account.fullName,
          email: draft.account.email,
          referralSource: draft.account.referralSource,
        }
      : null,
    organization: draft.organization,
    invites: draft.invites,
  };
  try {
    sessionStorage.setItem(SIGNUP_DRAFT_STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredSignupDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(SIGNUP_DRAFT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Merge stored draft with in-memory password when rehydrating. */
export function mergeStoredSignupDraft(
  stored: StoredSignupDraft,
  existingPassword: string,
): SignupDraft {
  return {
    account: stored.account
      ? {
          fullName: stored.account.fullName,
          email: stored.account.email,
          referralSource: stored.account.referralSource,
          password: existingPassword,
        }
      : null,
    organization: stored.organization,
    invites: stored.invites,
  };
}
