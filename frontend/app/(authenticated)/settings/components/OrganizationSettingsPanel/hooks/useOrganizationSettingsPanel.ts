"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBrowserAuthUserId } from "@/services/auth.service";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { canManageOrganizationSettings } from "@/utils/org-role";
import { useToast } from "@/atoms/toast";
import type { OrganizationMemberRole } from "@/types/database";
import { slugFromOrganizationName } from "@/utils/organization-slug";
import {
  useOrganizationMetricsQuery,
  useOrganizationMembersQuery,
} from "@/hooks/queries/useOrganization";
import {
  useUpdateOrganizationMemberMutation,
  useInviteOrganizationMemberMutation,
  useUpdateOrgSettingsMutation,
  useDeleteOrganizationMemberMutation,
} from "@/hooks/mutations/useOrganization";

const ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "member"];

export function useOrganizationSettingsPanel(embedded = false) {
  const { toast } = useToast();
  const { orgs, selectedOrgId, isSuperAdmin, refreshOrgs } = useOrganizationWorkspace();

  const selectedRow = useMemo(
    () => orgs.find((r) => r.organizations?.id === selectedOrgId),
    [orgs, selectedOrgId],
  );
  const org = selectedRow?.organizations ?? null;
  const membershipRole = selectedRow?.role ?? null;
  const canManage = canManageOrganizationSettings(isSuperAdmin, membershipRole);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [orgImagePath, setOrgImagePath] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationMemberRole>("member");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [membersActionError, setMembersActionError] = useState<string | null>(null);

  const metricsQuery = useOrganizationMetricsQuery(selectedOrgId);
  const membersQuery = useOrganizationMembersQuery(selectedOrgId);
  const updateRoleMutation = useUpdateOrganizationMemberMutation();
  const inviteMutation = useInviteOrganizationMemberMutation();
  const updateOrgMutation = useUpdateOrgSettingsMutation();
  const deleteMemberMutation = useDeleteOrganizationMemberMutation();

  useEffect(() => {
    void getBrowserAuthUserId().then(setCurrentUserId);
  }, []);

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setSlug(org.slug);
    setOrgImagePath(org.org_image_path ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- org object identity churns; primitives capture saved-field changes only
  }, [org?.id, org?.name, org?.slug, org?.org_image_path]);

  const pendingId =
    updateRoleMutation.isPending && updateRoleMutation.variables
      ? updateRoleMutation.variables.membershipId
      : deleteMemberMutation.isPending && deleteMemberMutation.variables
        ? deleteMemberMutation.variables
        : null;

  const saveOrganizationDetails = useCallback(async () => {
    if (!org || !canManage) return;
    const n = name.trim();
    const s = slug.trim() || slugFromOrganizationName(n);
    if (!n) {
      toast("Organization name is required.", "error");
      return;
    }
    try {
      await updateOrgMutation.mutateAsync({ organizationId: org.id, name: n, slug: s });
      await refreshOrgs();
      toast("Organization details saved", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save organization", "error");
    }
  }, [org, canManage, name, slug, updateOrgMutation, refreshOrgs, toast]);

  const updateMemberRole = useCallback(
    async (membershipId: string, role: OrganizationMemberRole) => {
      setMembersActionError(null);
      try {
        await updateRoleMutation.mutateAsync({ membershipId, role });
      } catch (e) {
        setMembersActionError(e instanceof Error ? e.message : "Update failed");
      }
    },
    [updateRoleMutation],
  );

  const removeMember = useCallback(
    async (membershipId: string) => {
      if (!canManage) return;
      if (!window.confirm("Remove this person from the organization?")) return;
      setMembersActionError(null);
      try {
        await deleteMemberMutation.mutateAsync(membershipId);
        toast("Member removed", "success");
      } catch (e) {
        setMembersActionError(e instanceof Error ? e.message : "Could not remove member");
      }
    },
    [canManage, deleteMemberMutation, toast],
  );

  const submitInvite = useCallback(async () => {
    if (!selectedOrgId || !canManage) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      toast("Enter a valid email address.", "error");
      return;
    }
    try {
      const payload = await inviteMutation.mutateAsync({
        organization_id: selectedOrgId,
        email,
        role: inviteRole,
      });
      setInviteEmail("");
      toast(
        payload.invited
          ? "Invite sent — they’re on the roster; they finish signup from the email link."
          : "Member added to this organization.",
        "success",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not add member", "error");
    }
  }, [selectedOrgId, canManage, inviteEmail, inviteRole, inviteMutation, toast]);

  const membersError =
    membersActionError ??
    (membersQuery.error instanceof Error ? membersQuery.error.message : null);
  const metrics = metricsQuery.data ?? {
    trackingRequests: null,
    shipments: null,
    members: null,
  };

  const top = embedded ? "mt-0" : "mt-10";

  return {
    top,
    orgs,
    selectedOrgId,
    org,
    canManage,
    name,
    setName,
    slug,
    setSlug,
    orgImagePath,
    setOrgImagePath,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    currentUserId,
    metrics,
    metricsLoading: metricsQuery.isLoading,
    members: membersQuery.data ?? [],
    membersLoading: membersQuery.isLoading,
    membersError,
    pendingId,
    savingOrg: updateOrgMutation.isPending,
    inviteBusy: inviteMutation.isPending,
    refreshOrgs,
    saveOrganizationDetails,
    updateMemberRole,
    removeMember,
    submitInvite,
    ROLE_OPTIONS,
  };
}
