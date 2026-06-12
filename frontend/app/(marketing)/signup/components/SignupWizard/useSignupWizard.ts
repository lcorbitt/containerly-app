"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getVerifiedBrowserAuthSession,
  subscribeToAuthState,
  syncServerAuthSession,
} from "@/services/auth.service";
import { useOnboardingStatusQuery } from "@/hooks/queries/useOnboarding";
import {
  clearStoredSignupOrganizationId,
  parseSignupStep,
  readStoredSignupOrganizationId,
  signupStepHref,
  storeSignupOrganizationId,
} from "./utils";
import type { SignupWizardStep } from "./types";

export function useSignupWizard(initialStep: SignupWizardStep) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = parseSignupStep(searchParams.get("step") ?? String(initialStep));

  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const refreshSession = useCallback(async () => {
    let session = await getVerifiedBrowserAuthSession();
    if (session) {
      const sync = await syncServerAuthSession();
      if (sync.error) {
        session = null;
      }
    }
    const signedIn = Boolean(session);
    setHasSession(signedIn);
    setSessionChecked(true);
    return signedIn;
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    return subscribeToAuthState((signedIn) => {
      setHasSession(signedIn);
      setSessionChecked(true);
    });
  }, []);

  const statusQuery = useOnboardingStatusQuery(sessionChecked && hasSession);
  const [createdOrgId, setCreatedOrgId] = useState<string | null>(null);
  const organizationId =
    createdOrgId ??
    readStoredSignupOrganizationId() ??
    statusQuery.data?.organizationId ??
    null;

  const hasOrgMembership = statusQuery.data?.hasOrgMembership ?? false;

  useEffect(() => {
    if (
      statusQuery.error instanceof Error &&
      /unauthorized/i.test(statusQuery.error.message)
    ) {
      setHasSession(false);
    }
  }, [statusQuery.error]);

  useEffect(() => {
    if (!sessionChecked) return;
    if (hasSession && statusQuery.isLoading) return;

    if (!hasSession && step > 1) {
      router.replace("/signup");
      return;
    }

    if (hasOrgMembership && step === 1) {
      router.replace("/signup?step=3");
      return;
    }

    if (hasOrgMembership && step === 2) {
      router.replace("/signup?step=3");
    }
  }, [
    sessionChecked,
    statusQuery.isLoading,
    hasSession,
    hasOrgMembership,
    step,
    router,
  ]);

  const goToStep = useCallback(
    async (next: SignupWizardStep) => {
      const signedIn = await refreshSession();
      if (!signedIn) return;
      router.push(signupStepHref(next));
      router.refresh();
    },
    [router, refreshSession],
  );

  const onOrganizationCreated = useCallback(
    (orgId: string) => {
      storeSignupOrganizationId(orgId);
      setCreatedOrgId(orgId);
      goToStep(3);
    },
    [goToStep],
  );

  const finishSignup = useCallback(() => {
    clearStoredSignupOrganizationId();
    router.push("/dashboard?welcome=1");
    router.refresh();
  }, [router]);

  return {
    step,
    goToStep,
    hasSession,
    sessionChecked,
    statusLoading: statusQuery.isLoading,
    pendingInvite: statusQuery.data?.pendingTenantInvite ?? null,
    hasOrgMembership,
    organizationId,
    onOrganizationCreated,
    finishSignup,
  };
}
