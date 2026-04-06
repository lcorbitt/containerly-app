import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteOrganizationMemberByIdBrowser } from "@/services/organization-tenant.service";
import { orgMembersRootKey } from "@/hooks/queries/use-organization-members";
import { orgMetricsRootKey } from "@/hooks/queries/use-organization-metrics";

export function useDeleteOrganizationMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => deleteOrganizationMemberByIdBrowser(membershipId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgMembersRootKey });
      void qc.invalidateQueries({ queryKey: orgMetricsRootKey });
    },
  });
}
