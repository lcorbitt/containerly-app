"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ShipmentAccessTabSnapshot } from "@/services/shipment.service";
import { useOrganizationWorkspaceOptional } from "@/atoms/organization-workspace";
import { useToast } from "@/atoms/toast";
import { useResolveCustomerAccessRequestMutation } from "@/hooks/mutations/useAlerts";
import {
  useCreateCustomerInviteMutation,
  useDeleteShipmentParticipantMutation,
  useInsertShipmentParticipantMutation,
  useRevokeCustomerInviteMutation,
  useRevokeShipmentCustomerAccessMutation,
  useUpdateShipmentAssigneeMutation,
} from "@/hooks/mutations/useShipments";
import {
  invalidateShipmentAccessTabQuery,
  shipmentAccessTabQueryKey,
  useShipmentAccessTabQuery,
} from "@/hooks/queries/useShipment";
import type { CustomSelectOption } from "@/components/CustomSelect";
import { parseCustomerInviteRecipients } from "@/utils/customer-invite-recipients";
import { isCustomerInviteOperatorEmailError } from "@/utils/customer-invite-errors";

export function useShipmentAccessTabContent({
  shipmentId,
  initialAssigneeUserId,
  onMetaChanged,
  organizationId: organizationIdProp,
}: {
  shipmentId: string;
  initialAssigneeUserId: string | null;
  onMetaChanged: () => void;
  /** When set (e.g. customer portal), skips OrganizationWorkspaceHost. */
  organizationId?: string | null;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const workspaceOrgId = useOrganizationWorkspaceOptional()?.selectedOrgId ?? null;
  const selectedOrgId = organizationIdProp ?? workspaceOrgId;

  const accessTabQuery = useShipmentAccessTabQuery({
    shipmentId,
    organizationId: selectedOrgId,
  });
  const snap = accessTabQuery.data;

  const assigneeMutation = useUpdateShipmentAssigneeMutation();
  const insertParticipantMutation = useInsertShipmentParticipantMutation();
  const deleteParticipantMutation = useDeleteShipmentParticipantMutation();
  const createInviteMutation = useCreateCustomerInviteMutation();
  const revokeInviteMutation = useRevokeCustomerInviteMutation();
  const revokeAccessMutation = useRevokeShipmentCustomerAccessMutation();
  const resolveAccessRequestMutation = useResolveCustomerAccessRequestMutation(selectedOrgId);

  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFieldError, setInviteFieldError] = useState<string | null>(null);
  const [inviteCreating, setInviteCreating] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [inviteDeliveryMode, setInviteDeliveryMode] = useState<"email_invite" | "allowlist_only">(
    "email_invite",
  );

  const loading = accessTabQuery.isLoading;

  const refreshAccessTab = useCallback(async () => {
    if (!selectedOrgId) return;
    await invalidateShipmentAccessTabQuery(qc, { shipmentId, organizationId: selectedOrgId });
  }, [qc, selectedOrgId, shipmentId]);

  const applySavedTags = useCallback(
    (savedTags: string[]) => {
      if (!selectedOrgId) return;
      qc.setQueryData(
        shipmentAccessTabQueryKey(shipmentId, selectedOrgId),
        (prev: ShipmentAccessTabSnapshot | undefined) => {
          if (!prev) return prev;
          const mergedSuggestions = new Set(prev.orgTagSuggestions);
          for (const tag of savedTags) mergedSuggestions.add(tag);
          return {
            ...prev,
            tags: savedTags,
            orgTagSuggestions: [...mergedSuggestions].sort((a, b) => a.localeCompare(b)),
          };
        },
      );
    },
    [qc, selectedOrgId, shipmentId],
  );

  const assigneeUserId = snap?.assigneeUserId ?? initialAssigneeUserId;
  const participantRows = snap?.participantRows ?? [];
  const orgPeers = snap?.orgPeers ?? [];
  const profileImagePathByUserId = snap?.profileImagePathByUserId ?? {};
  const customerAccessRows = snap?.customerAccessRows ?? [];
  const pendingInvites = snap?.pendingInvites ?? [];
  const pendingAccessRequests = snap?.pendingAccessRequests ?? [];
  const messageAuthorByUserId = snap?.messageAuthorByUserId ?? {};
  const customerEmailByUserId = snap?.customerEmailByUserId ?? {};
  const tags = snap?.tags ?? [];
  const orgTagSuggestions = snap?.orgTagSuggestions ?? [];
  const emailNotificationsSubscribed = snap?.emailNotificationsSubscribed ?? false;

  const participantUserIdSet = useMemo(
    () => new Set(participantRows.map((p) => p.user_id)),
    [participantRows],
  );

  const participantRowsWithoutAssignee = useMemo(() => {
    if (!assigneeUserId) return participantRows;
    return participantRows.filter((row) => row.user_id !== assigneeUserId);
  }, [participantRows, assigneeUserId]);

  const peersAvailableToAdd = useMemo(() => {
    return orgPeers.filter(
      (p) => !participantUserIdSet.has(p.id) && (!assigneeUserId || p.id !== assigneeUserId),
    );
  }, [orgPeers, participantUserIdSet, assigneeUserId]);

  const assigneeSelectOptions = useMemo((): CustomSelectOption[] => {
    return [
      { value: "", label: "Unassigned" },
      ...orgPeers.map((p) => ({
        value: p.id,
        label: p.label,
        avatarUrl: getProfileImagePublicUrlBrowser(profileImagePathByUserId[p.id] ?? null),
      })),
    ];
  }, [orgPeers, profileImagePathByUserId]);

  const participantsMenuOptions = useMemo((): CustomSelectOption[] => {
    return peersAvailableToAdd.map((p) => ({
      value: p.id,
      label: p.label,
      avatarUrl: getProfileImagePublicUrlBrowser(profileImagePathByUserId[p.id] ?? null),
    }));
  }, [peersAvailableToAdd, profileImagePathByUserId]);

  const activeAccessWithLabels = useMemo(() => {
    return customerAccessRows.map((access) => {
      const label =
        customerEmailByUserId[access.customer_user_id]?.trim() ||
        `User ${access.customer_user_id.slice(0, 8)}…`;
      return { access, label };
    });
  }, [customerAccessRows, customerEmailByUserId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const updateAssignee = useCallback(
    async (userId: string | null) => {
      if (!selectedOrgId) return;
      try {
        await assigneeMutation.mutateAsync({
          shipmentId,
          organizationId: selectedOrgId,
          assigneeUserId: userId,
        });
        toast("Assignee updated", "success");
        await refreshAccessTab();
        onMetaChanged();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not update assignee", "error");
      }
    },
    [assigneeMutation, onMetaChanged, refreshAccessTab, selectedOrgId, shipmentId, toast],
  );

  const addParticipantUser = useCallback(
    async (userId: string) => {
      if (!userId || !selectedOrgId) return;
      try {
        await insertParticipantMutation.mutateAsync({
          organizationId: selectedOrgId,
          shipmentId,
          userId,
        });
        toast("Participant added", "success");
        await refreshAccessTab();
        onMetaChanged();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not add participant", "error");
      }
    },
    [insertParticipantMutation, onMetaChanged, refreshAccessTab, selectedOrgId, shipmentId, toast],
  );

  const removeParticipantRow = useCallback(
    async (rowId: string) => {
      setRemovingParticipantId(rowId);
      try {
        await deleteParticipantMutation.mutateAsync(rowId);
        toast("Participant removed", "success");
        await refreshAccessTab();
        onMetaChanged();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not remove participant", "error");
      } finally {
        setRemovingParticipantId(null);
      }
    },
    [deleteParticipantMutation, onMetaChanged, refreshAccessTab, toast],
  );

  const handleInviteEmailChange = useCallback((value: string) => {
    setInviteEmail(value);
    setInviteFieldError(null);
  }, []);

  const createInvite = useCallback(async () => {
    if (!selectedOrgId) return;
    setInviteFieldError(null);

    const { emails, invalidTokens } = parseCustomerInviteRecipients(inviteEmail);
    if (invalidTokens.length > 0) {
      toast(
        `Enter valid email addresses (including group lists like team@company.com). Invalid: ${invalidTokens.join(", ")}`,
        "error",
      );
      return;
    }
    if (emails.length === 0) {
      toast("Enter at least one customer email address.", "error");
      return;
    }

    setInviteCreating(true);
    try {
      const hubUrl = `${origin}/shipments/hub/${shipmentId}`;
      let successCount = 0;
      let singleInviteUrl: string | null = null;
      const failures: string[] = [];

      for (const email of emails) {
        const r = await createInviteMutation.mutateAsync({
          organizationId: selectedOrgId,
          shipmentId,
          invitedEmail: email,
          deliveryMode: inviteDeliveryMode,
        });
        if (!r.ok) {
          failures.push(`${email}: ${r.error}`);
          if (isCustomerInviteOperatorEmailError(r.error)) {
            setInviteFieldError(r.error);
          }
          continue;
        }

        successCount += 1;
        singleInviteUrl =
          inviteDeliveryMode === "allowlist_only"
            ? hubUrl
            : r.invite_url.startsWith("http")
              ? r.invite_url
              : `${origin}${r.invite_url}`;
      }

      if (successCount === 0) {
        const firstFailure = failures[0] ?? "Could not create invites.";
        const errMsg = firstFailure.includes(": ")
          ? firstFailure.slice(firstFailure.indexOf(": ") + 2)
          : firstFailure;
        const operatorOnly =
          failures.length === 1 && isCustomerInviteOperatorEmailError(errMsg);
        if (!operatorOnly) {
          toast(firstFailure, "error");
        }
        return;
      }

      setInviteEmail("");
      setInviteFieldError(null);
      await refreshAccessTab();

      if (successCount === 1 && singleInviteUrl) {
        setLastInviteUrl(singleInviteUrl);
      } else if (inviteDeliveryMode === "allowlist_only") {
        setLastInviteUrl(hubUrl);
      } else {
        setLastInviteUrl(null);
      }

      if (failures.length > 0) {
        toast(
          `${successCount} invite${successCount === 1 ? "" : "s"} sent. ${failures.length} failed.`,
          "info",
        );
        return;
      }

      if (successCount > 1) {
        toast(
          inviteDeliveryMode === "allowlist_only"
            ? `${successCount} emails allowlisted — share the portal link with your customers.`
            : `${successCount} invite emails sent.`,
          "success",
        );
        return;
      }

      toast(
        inviteDeliveryMode === "allowlist_only"
          ? "Email allowlisted — share the portal link with your customer."
          : "Invite email sent — copy the link below if needed.",
        "success",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create invite", "error");
    } finally {
      setInviteCreating(false);
    }
  }, [
    createInviteMutation,
    inviteDeliveryMode,
    inviteEmail,
    origin,
    refreshAccessTab,
    selectedOrgId,
    shipmentId,
    toast,
  ]);

  const resolveAccessRequestRow = useCallback(
    async (accessRequestId: string, action: "approve" | "deny") => {
      setResolvingRequestId(accessRequestId);
      try {
        const r = await resolveAccessRequestMutation.mutateAsync({ accessRequestId, action });
        if (!r.ok) {
          toast(r.error, "error");
          return;
        }
        toast(action === "approve" ? "Access approved and invite sent." : "Request denied.", "success");
        onMetaChanged();
      } finally {
        setResolvingRequestId(null);
      }
    },
    [onMetaChanged, resolveAccessRequestMutation, toast],
  );

  const revokeInviteRow = useCallback(
    async (id: string) => {
      try {
        await revokeInviteMutation.mutateAsync(id);
        await refreshAccessTab();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not revoke invite", "error");
      }
    },
    [refreshAccessTab, revokeInviteMutation, toast],
  );

  const revokeAccessRow = useCallback(
    async (id: string) => {
      try {
        await revokeAccessMutation.mutateAsync(id);
        await refreshAccessTab();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not revoke access", "error");
      }
    },
    [refreshAccessTab, revokeAccessMutation, toast],
  );

  return {
    selectedOrgId,
    loading,

    assigneeUserId,
    assigneeSaving: assigneeMutation.isPending,
    assigneeSelectOptions,
    updateAssignee,

    participantBusy: insertParticipantMutation.isPending,
    removingParticipantId,
    participantRowsWithoutAssignee,
    participantsMenuOptions,
    addParticipantUser,
    removeParticipantRow,

    profileImagePathByUserId,
    messageAuthorByUserId,

    inviteEmail,
    setInviteEmail: handleInviteEmailChange,
    inviteFieldError,
    inviteDeliveryMode,
    setInviteDeliveryMode,
    inviteCreating,
    lastInviteUrl,
    setLastInviteUrl,
    pendingInvites,
    pendingAccessRequests,
    resolvingRequestId,
    resolveAccessRequestRow,
    activeAccessWithLabels,
    origin,
    createInvite,
    revokeInviteRow,
    revokeAccessRow,
    load: refreshAccessTab,
    toast,

    tags,
    orgTagSuggestions,
    applySavedTags,
    emailNotificationsSubscribed,
  } as const;
}

export type ShipmentAccessTabContentState = ReturnType<typeof useShipmentAccessTabContent>;
