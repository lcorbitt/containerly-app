import { useQuery } from "@tanstack/react-query";
import { listTenantInvites } from "@/services/onboarding.service";

export const adminTenantInvitesQueryKey = ["admin", "tenant-invites"] as const;

export function useAdminTenantInvitesQuery(enabled = true) {
  return useQuery({
    queryKey: adminTenantInvitesQueryKey,
    queryFn: listTenantInvites,
    enabled,
    staleTime: 30_000,
  });
}
