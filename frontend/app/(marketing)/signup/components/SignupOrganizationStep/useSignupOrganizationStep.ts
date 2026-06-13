"use client";

import { useState } from "react";
import { useToast } from "@/atoms/toast";
import { useCompleteOnboardingOrganizationMutation } from "@/hooks/mutations/useOnboarding";
import { useOrganizationImageQuery } from "@/hooks/queries/useOrganization";
import { slugFromOrganizationName } from "@/utils/organization-slug";
import type { PendingTenantInviteSummary } from "@/types/platform-tenant-invite";
import { storeSignupOrganizationId } from "../SignupWizard/utils";

interface UseSignupOrganizationStepInput {
  pendingInvite: PendingTenantInviteSummary | null;
  organizationId: string | null;
  onOrganizationIdReady: (organizationId: string) => void;
  onComplete: (organizationId: string) => void;
}

export function useSignupOrganizationStep({
  pendingInvite,
  organizationId,
  onOrganizationIdReady,
  onComplete,
}: UseSignupOrganizationStepInput) {
  const { toast } = useToast();
  const mutation = useCompleteOnboardingOrganizationMutation();

  const [name, setName] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [monthlyShipmentVolume, setMonthlyShipmentVolume] = useState("");
  const [localOrganizationId, setLocalOrganizationId] = useState<string | null>(null);

  const suggestedOrgName = pendingInvite?.suggestedOrgName?.trim() ?? "";
  const activeOrganizationId = organizationId ?? localOrganizationId;
  const fieldsLocked = Boolean(activeOrganizationId);

  const orgImageQuery = useOrganizationImageQuery(activeOrganizationId);
  const orgImagePath = activeOrganizationId ? (orgImageQuery.data ?? null) : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (activeOrganizationId) {
      onComplete(activeOrganizationId);
      return;
    }

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
      setLocalOrganizationId(result.id);
      storeSignupOrganizationId(result.id);
      onOrganizationIdReady(result.id);
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
    activeOrganizationId,
    orgImagePath,
    fieldsLocked,
    submit,
    loading: mutation.isPending,
  };
}
