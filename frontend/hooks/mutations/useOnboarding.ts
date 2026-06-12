import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAdminTenantInvite,
  createOnboardingOrganization,
} from "@/services/onboarding.service";
import { onboardingStatusQueryKey } from "@/hooks/queries/useOnboarding";
import { adminTenantInvitesQueryKey } from "@/hooks/queries/useAdminTenantInvites";

export function useCreateOnboardingOrganizationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      slug: string | null;
      teamSize?: string | null;
      monthlyShipmentVolume?: string | null;
    }) => createOnboardingOrganization(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: onboardingStatusQueryKey });
    },
  });
}

export function useCreateAdminTenantInviteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; suggestedOrgName?: string | null }) =>
      createAdminTenantInvite(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminTenantInvitesQueryKey });
    },
  });
}
