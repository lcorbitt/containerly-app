import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  completeOnboardingOrganization,
  createTenantInvite,
} from "@/services/onboarding.service";
import { onboardingStatusQueryKey } from "@/hooks/queries/useOnboarding";
import { adminTenantInvitesQueryKey } from "@/hooks/queries/useAdminTenantInvites";

export function useCompleteOnboardingOrganizationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      slug: string | null;
      teamSize?: string | null;
      monthlyShipmentVolume?: string | null;
    }) => completeOnboardingOrganization(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: onboardingStatusQueryKey });
    },
  });
}

export function useCreateTenantInviteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; suggestedOrgName?: string | null }) =>
      createTenantInvite(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminTenantInvitesQueryKey });
    },
  });
}
