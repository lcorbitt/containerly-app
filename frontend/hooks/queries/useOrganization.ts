import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminOrgMemberDirectoryRows,
  fetchCustomerDirectoryBrowser,
  fetchOrganizationMemberRowsBrowser,
  fetchOrganizationMetricsBrowser,
  fetchPendingAccessRequestsBrowser,
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

export const pendingAccessRequestsRootKey = ["pending-access-requests"] as const;
export const customerDirectoryRootKey = ["customer-directory"] as const;

export function usePendingAccessRequestsQuery(organizationId: string | null) {
  return useQuery({
    queryKey: [...pendingAccessRequestsRootKey, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchPendingAccessRequestsBrowser(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}

export function useCustomerDirectoryQuery(organizationId: string | null) {
  return useQuery({
    queryKey: [...customerDirectoryRootKey, organizationId],
    queryFn: async () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchCustomerDirectoryBrowser(organizationId);
    },
    enabled: Boolean(organizationId),
  });
}
