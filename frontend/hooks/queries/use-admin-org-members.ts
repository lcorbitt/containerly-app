import { useQuery } from "@tanstack/react-query";
import { fetchAdminOrgMemberDirectoryRows } from "@/services/admin-org-directory.service";

export const adminOrgMembersQueryKey = ["admin-org-members"] as const;

export function useAdminOrgMembersQuery() {
  return useQuery({
    queryKey: adminOrgMembersQueryKey,
    queryFn: fetchAdminOrgMemberDirectoryRows,
  });
}
