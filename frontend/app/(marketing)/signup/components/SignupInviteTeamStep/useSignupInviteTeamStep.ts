"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/contexts/toast";
import { useInviteOrganizationMemberMutation } from "@/hooks/mutations/useOrganization";
import { useOnboardingStatusQuery } from "@/hooks/queries/useOnboarding";
import { readStoredSignupOrganizationId } from "../SignupWizard/utils";
import { createInviteRow, filledInviteRows } from "./utils";
import type { SignupInviteRow } from "./types";

interface UseSignupInviteTeamStepInput {
  organizationId: string | null;
  onComplete: () => void;
}

export function useSignupInviteTeamStep({
  organizationId,
  onComplete,
}: UseSignupInviteTeamStepInput) {
  const { toast } = useToast();
  const statusQuery = useOnboardingStatusQuery();
  const inviteMutation = useInviteOrganizationMemberMutation();

  const [rows, setRows] = useState<SignupInviteRow[]>(() => [createInviteRow()]);
  const [loading, setLoading] = useState(false);

  const resolvedOrgId =
    organizationId ?? readStoredSignupOrganizationId() ?? statusQuery.data?.organizationId ?? null;

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createInviteRow()]);
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<SignupInviteRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const sendInvites = useCallback(async () => {
    if (!resolvedOrgId) {
      toast("Organization not found. Try refreshing the page.", "error");
      return;
    }

    const toSend = filledInviteRows(rows);
    if (toSend.length === 0) {
      onComplete();
      return;
    }

    setLoading(true);
    let successCount = 0;
    const errors: string[] = [];

    try {
      for (const row of toSend) {
        try {
          await inviteMutation.mutateAsync({
            organization_id: resolvedOrgId,
            email: row.email.trim().toLowerCase(),
            role: row.role,
          });
          successCount += 1;
        } catch (err) {
          errors.push(
            `${row.email}: ${err instanceof Error ? err.message : "Invite failed"}`,
          );
        }
      }

      if (successCount > 0) {
        toast(
          successCount === 1 ? "1 invite sent." : `${successCount} invites sent.`,
          "success",
        );
      }
      if (errors.length > 0) {
        toast(errors[0] ?? "Some invites failed.", "error");
      }

      onComplete();
    } finally {
      setLoading(false);
    }
  }, [resolvedOrgId, rows, inviteMutation, toast, onComplete]);

  return {
    rows,
    addRow,
    updateRow,
    sendInvites,
    loading: loading || inviteMutation.isPending,
    resolvedOrgId,
  };
}
