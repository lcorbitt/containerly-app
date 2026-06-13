"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSignupDraft } from "@/atoms/signup-draft";
import { useToast } from "@/atoms/toast";
import { useSubmitSignupMutation } from "@/hooks/mutations/useSignup";
import { onboardingStatusQueryKey } from "@/hooks/queries/useOnboarding";
import type { SignupInviteDraft } from "./types";

interface UseSubmitSignupInput {
  hasSession: boolean;
}

export function useSubmitSignup({ hasSession }: UseSubmitSignupInput) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { draft, orgImageFile, resetSignupDraft, patchDraft } = useSignupDraft();
  const mutation = useSubmitSignupMutation();

  const submitSignup = useCallback(
    async (invites: SignupInviteDraft[]) => {
      if (!draft.organization) {
        toast("Complete the team step before finishing sign-up.", "error");
        return;
      }

      if (!hasSession && !draft.account) {
        toast("Account details are required to finish sign-up.", "error");
        return;
      }

      const nextDraft = { ...draft, invites };
      patchDraft({ invites });

      try {
        await mutation.mutateAsync({
          draft: nextDraft,
          orgImageFile,
          hasSession,
        });
        resetSignupDraft();
        void queryClient.invalidateQueries({ queryKey: onboardingStatusQueryKey });
        router.push("/dashboard?welcome=1");
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Could not complete sign-up", "error");
      }
    },
    [
      draft,
      hasSession,
      orgImageFile,
      mutation,
      patchDraft,
      queryClient,
      resetSignupDraft,
      router,
      toast,
    ],
  );

  return {
    submitSignup,
    isSubmitting: mutation.isPending,
  };
}
