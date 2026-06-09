import { useQuery } from "@tanstack/react-query";
import { fetchAdminTenantInviteRows } from "@/services/onboarding.service";

export const adminTenantInvitesQueryKey = ["admin", "tenant-invites"] as const;

export function useAdminTenantInvitesQuery(enabled = true) {
  return useQuery({
    queryKey: adminTenantInvitesQueryKey,
    queryFn: fetchAdminTenantInviteRows,
    enabled,
    staleTime: 30_000,
  });
}
