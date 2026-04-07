import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createOrganization,
  inviteOrganizationMember,
  patchOrganizationMemberRole,
  updateOrganizationNameAndSlugBrowser,
  deleteOrganizationMemberByIdBrowser,
} from "@/services/organization.service";
import type { OrganizationMemberRole } from "@/types/database";
import {
  adminOrgMembersQueryKey,
  orgMembersRootKey,
  orgMetricsRootKey,
} from "@/hooks/queries/useOrganization";

export function useCreateOrganizationMutation() {
  return useMutation({
    mutationFn: (input: { name: string; slug: string | null }) => createOrganization(input),
  });
}

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

export function useUpdateOrganizationDetailsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { organizationId: string; name: string; slug: string }) =>
      updateOrganizationNameAndSlugBrowser(input.organizationId, input.name, input.slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orgMetricsRootKey });
    },
  });
}

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
