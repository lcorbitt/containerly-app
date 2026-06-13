"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  getBrowserAuthSession,
  listenForPasswordRecovery,
  notifyPasswordChanged,
  syncServerAuthSession,
  updatePassword,
} from "@/services/auth.service";
import { getOnboardingStatus } from "@/services/onboarding.service";
import { onboardingStatusQueryKey } from "@/hooks/queries/useOnboarding";
import { SET_PASSWORD_MIN_LENGTH } from "./constants";
import type { SetPasswordFlow } from "./types";

interface UseSetPasswordFormInput {
  initialFlow: SetPasswordFlow;
}

export function useSetPasswordForm({ initialFlow }: UseSetPasswordFormInput) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [flow, setFlow] = useState<SetPasswordFlow>(initialFlow);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    void getBrowserAuthSession().then((session) => {
      if (!session) setNeedsAuth(true);
    });
    const unsub = listenForPasswordRecovery(() => setFlow("recovery"));
    return unsub;
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (password.length < SET_PASSWORD_MIN_LENGTH) {
      setMessage(`Password must be at least ${SET_PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;

      if (flow === "recovery") {
        const notify = await notifyPasswordChanged();
        if (notify.error) {
          console.warn("[set-password] notification failed", notify.error.message);
        }
        router.push("/login");
        router.refresh();
        return;
      }

      const sync = await syncServerAuthSession();
      if (sync.error) throw sync.error;

      try {
        const status = await queryClient.fetchQuery({
          queryKey: onboardingStatusQueryKey,
          queryFn: getOnboardingStatus,
        });
        if (!status.hasOrgMembership) {
          router.push("/signup?step=2");
          router.refresh();
          return;
        }
      } catch {
        /* fall through to dashboard */
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update password");
      setLoading(false);
    }
  }

  return {
    flow,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    message,
    loading,
    needsAuth,
    submit,
  };
}
