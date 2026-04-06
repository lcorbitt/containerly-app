import { useQuery } from "@tanstack/react-query";
import { fetchTrackingDashboardSnapshot } from "@/services/tracking-dashboard.service";

export const trackingDashboardQueryKeyRoot = ["tracking-dashboard"] as const;

export function useTrackingDashboardQuery(organizationId: string | null) {
  return useQuery({
    queryKey: [...trackingDashboardQueryKeyRoot, organizationId],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchTrackingDashboardSnapshot(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
