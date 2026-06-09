import { useQuery } from "@tanstack/react-query";
import { fetchOnboardingStatus } from "@/services/onboarding.service";

export const onboardingStatusQueryKey = ["onboarding", "status"] as const;

export function useOnboardingStatusQuery(enabled = true) {
  return useQuery({
    queryKey: onboardingStatusQueryKey,
    queryFn: fetchOnboardingStatus,
    enabled,
    staleTime: 30_000,
  });
}
