import { useQuery } from "@tanstack/react-query";
import { getOnboardingStatus } from "@/services/onboarding.service";

export const onboardingStatusQueryKey = ["onboarding", "status"] as const;

export function useOnboardingStatusQuery(enabled = true) {
  return useQuery({
    queryKey: onboardingStatusQueryKey,
    queryFn: getOnboardingStatus,
    enabled,
    staleTime: 30_000,
  });
}
