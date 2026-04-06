import { useQuery } from "@tanstack/react-query";
import { fetchOrganizationMemberRowsBrowser } from "@/services/organization-tenant.service";

export const orgMembersRootKey = ["org-members"] as const;

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
