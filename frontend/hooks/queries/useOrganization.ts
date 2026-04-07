import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminOrgMemberDirectoryRows,
  fetchOrganizationMetricsBrowser,
  fetchOrganizationMemberRowsBrowser,
} from "@/services/organization.service";

export const adminOrgMembersQueryKey = ["admin-org-members"] as const;
export const orgMetricsRootKey = ["org-metrics"] as const;
export const orgMembersRootKey = ["org-members"] as const;

export function useAdminOrgMembersQuery() {
  return useQuery({
    queryKey: adminOrgMembersQueryKey,
    queryFn: fetchAdminOrgMemberDirectoryRows,
  });
}

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

export function useOrganizationMembersQuery(organizationId: string | null) {
  return useQuery({
    queryKey: [...orgMembersRootKey, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchOrganizationMemberRowsBrowser(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
