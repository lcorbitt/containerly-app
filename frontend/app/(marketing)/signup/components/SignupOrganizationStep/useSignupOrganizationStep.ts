"use client";

import { useState } from "react";
import { useToast } from "@/contexts/toast";
import { useCreateOnboardingOrganizationMutation } from "@/hooks/mutations/useOnboarding";
import { slugFromOrganizationName } from "@/utils/organization-slug";
import type { PendingTenantInviteSummary } from "@/types/platform-tenant-invite";

interface UseSignupOrganizationStepInput {
  pendingInvite: PendingTenantInviteSummary | null;
  onComplete: (organizationId: string) => void;
}

export function useSignupOrganizationStep({
  pendingInvite,
  onComplete,
}: UseSignupOrganizationStepInput) {
  const { toast } = useToast();
  const mutation = useCreateOnboardingOrganizationMutation();

  const [name, setName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [monthlyShipmentVolume, setMonthlyShipmentVolume] = useState("");
  const suggestedOrgName = pendingInvite?.suggestedOrgName?.trim() ?? "";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = (name.trim() || suggestedOrgName).trim();
    if (!trimmedName) {
      toast("Team name is required.", "error");
      return;
    }
    if (!teamSize) {
      toast("Please select your team size.", "error");
      return;
    }
    if (!monthlyShipmentVolume) {
      toast("Please select your monthly shipment volume.", "error");
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        name: trimmedName,
        slug: slugFromOrganizationName(trimmedName),
        teamSize,
        monthlyShipmentVolume,
      });
      onComplete(result.id);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not create organization", "error");
    }
  }

  return {
    name: name || suggestedOrgName,
    setName,
    teamSize,
    setTeamSize,
    monthlyShipmentVolume,
    setMonthlyShipmentVolume,
    submit,
    loading: mutation.isPending,
  };
}
