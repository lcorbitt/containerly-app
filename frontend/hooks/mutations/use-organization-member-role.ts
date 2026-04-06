import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchOrganizationMemberRole } from "@/services/organization-members.service";
import type { OrganizationMemberRole } from "@/types/database";
import { adminOrgMembersQueryKey } from "@/hooks/queries/use-admin-org-members";
import { orgMembersRootKey } from "@/hooks/queries/use-organization-members";
import { orgMetricsRootKey } from "@/hooks/queries/use-organization-metrics";

export function usePatchOrganizationMemberRoleMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { membershipId: string; role: OrganizationMemberRole }) =>
      patchOrganizationMemberRole(input.membershipId, input.role),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminOrgMembersQueryKey });
      void qc.invalidateQueries({ queryKey: orgMembersRootKey });
      void qc.invalidateQueries({ queryKey: orgMetricsRootKey });
    },
  });
}
