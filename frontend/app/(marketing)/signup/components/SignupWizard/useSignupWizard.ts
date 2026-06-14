"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignupDraft } from "@/atoms/signup-draft";
import {
  getVerifiedBrowserAuthSession,
  syncServerAuthSession,
} from "@/services/auth.service";
import { getOnboardingStatus } from "@/services/onboarding.service";
import {
  emptySignupDraft,
  mergeStoredSignupDraft,
  parseSignupStep,
  readStoredSignupDraft,
  signupStepHref,
} from "./utils";
import type { SignupWizardStep } from "./types";

export function useSignupWizard(initialStep: SignupWizardStep) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseSignupStep(searchParams.get("step") ?? String(initialStep));

  const { replaceDraft, updateDraft } = useSignupDraft();
  const [bootstrapReady, setBootstrapReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [suggestedOrgName, setSuggestedOrgName] = useState("");
  const bootstrapStarted = useRef(false);

  useEffect(() => {
    if (bootstrapStarted.current) return;
    bootstrapStarted.current = true;

    void (async () => {
      let currentDraft = emptySignupDraft();
      const stored = readStoredSignupDraft();
      if (stored) {
        currentDraft = mergeStoredSignupDraft(stored, "");
        replaceDraft(currentDraft);
      }

      let session = await getVerifiedBrowserAuthSession();
      if (session) {
        const sync = await syncServerAuthSession();
        if (sync.error) {
          session = null;
        }
      }

      const signedIn = Boolean(session);
      setHasSession(signedIn);

      if (signedIn) {
        try {
          const status = await getOnboardingStatus();
          if (status.hasOrgMembership) {
            router.replace("/dashboard");
            return;
          }
          const suggested = status.pendingTenantInvite?.suggestedOrgName?.trim() ?? "";
          setSuggestedOrgName(suggested);
          if (suggested && !currentDraft.organization?.name) {
            updateDraft({
              organization: {
                name: suggested,
                teamSize: currentDraft.organization?.teamSize ?? "",
                monthlyShipmentVolume: currentDraft.organization?.monthlyShipmentVolume ?? "",
              },
            });
          }
        } catch {
          /* optional during draft browsing */
        }
      }

      setBootstrapReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-time bootstrap on mount
  }, []);

  const goToStep = useCallback(
    (next: SignupWizardStep) => {
      router.push(signupStepHref(next));
    },
    [router],
  );

  const goBack = useCallback(() => {
    if (step <= 1) return;
    const previous = (step - 1) as SignupWizardStep;
    router.push(signupStepHref(previous));
  }, [step, router]);

  const goBackToLogin = useCallback(() => {
    router.push("/login");
  }, [router]);

  return {
    step,
    goToStep,
    goBack,
    goBackToLogin,
    hasSession,
    bootstrapReady,
    suggestedOrgName,
  };
}
