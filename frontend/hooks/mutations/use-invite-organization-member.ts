import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inviteOrganizationMember } from "@/services/organization-members.service";
import type { OrganizationMemberRole } from "@/types/database";
import { orgMembersRootKey } from "@/hooks/queries/use-organization-members";
import { orgMetricsRootKey } from "@/hooks/queries/use-organization-metrics";

export function useInviteOrganizationMemberMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      organization_id: string;
      email: string;
      role: OrganizationMemberRole;
    }) => inviteOrganizationMember(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgMembersRootKey });
      void qc.invalidateQueries({ queryKey: orgMetricsRootKey });
    },
  });
}
