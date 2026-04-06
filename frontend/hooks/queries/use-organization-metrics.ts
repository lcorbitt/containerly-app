import { useQuery } from "@tanstack/react-query";
import { fetchOrganizationMetricsBrowser } from "@/services/organization-tenant.service";

export const orgMetricsRootKey = ["org-metrics"] as const;

export function useOrganizationMetricsQuery(organizationId: string | null) {
  return useQuery({
    queryKey: [...orgMetricsRootKey, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchOrganizationMetricsBrowser(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
