"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  createImporterInvite,
  deleteShipmentParticipantRow,
  fetchShipmentAccessTabSnapshotForBrowser,
  insertShipmentParticipant,
  resolveCustomerAccessRequest,
  revokeCustomerInviteRow,
  revokeShipmentCustomerAccessRow,
  updateShipmentAssignee,
} from "@/services/shipment.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import { OrganizationWorkspaceContext } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentCustomerAccessRequest,
  ShipmentParticipant,
} from "@/types/database";
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
  /** When set (e.g. customer portal), skips OrganizationWorkspaceProvider. */
  organizationId?: string | null;
}) {
  const { toast } = useToast();
  const workspaceOrgId = useContext(OrganizationWorkspaceContext)?.selectedOrgId ?? null;
  const selectedOrgId = organizationIdProp ?? workspaceOrgId;
  const [assigneeUserId, setAssigneeUserId] = useState<string | null>(initialAssigneeUserId);
  const [assigneeSaving, setAssigneeSaving] = useState(false);
  const [participantRows, setParticipantRows] = useState<ShipmentParticipant[]>([]);
  const [orgPeers, setOrgPeers] = useState<{ id: string; label: string }[]>([]);
  const [profileImagePathByUserId, setProfileImagePathByUserId] = useState<
    Record<string, string | null>
  >({});
  const [participantBusy, setParticipantBusy] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [customerAccessRows, setCustomerAccessRows] = useState<ShipmentCustomerAccess[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CustomerInvite[]>([]);
  const [pendingAccessRequests, setPendingAccessRequests] = useState<ShipmentCustomerAccessRequest[]>(
    [],
  );
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFieldError, setInviteFieldError] = useState<string | null>(null);
  const [inviteCreating, setInviteCreating] = useState(false);
  const [resolvingRequestId, setResolvingRequestId] = useState<string | null>(null);
  const [inviteDeliveryMode, setInviteDeliveryMode] = useState<"email_invite" | "allowlist_only">("email_invite");
  const [messageAuthorByUserId, setMessageAuthorByUserId] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string[]>([]);
  const [orgTagSuggestions, setOrgTagSuggestions] = useState<string[]>([]);
  const [emailNotificationsSubscribed, setEmailNotificationsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  // Only the first load (per shipment/org) shows the full "Loading…" swap. Refreshes after
  // a mutation (approve/deny/invite/revoke) update data in place so the sidebar doesn't blank.
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    setAssigneeUserId(initialAssigneeUserId);
  }, [initialAssigneeUserId, shipmentId]);

  useEffect(() => {
    hasLoadedRef.current = false;
    setLoading(true);
  }, [shipmentId, selectedOrgId]);

  const load = useCallback(async () => {
    if (!selectedOrgId) return;
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const snap = await fetchShipmentAccessTabSnapshotForBrowser({
        shipmentId,
        organizationId: selectedOrgId,
      });
      setAssigneeUserId(snap.assigneeUserId);
      setParticipantRows(snap.participantRows);
      setCustomerAccessRows(snap.customerAccessRows);
      setPendingInvites(snap.pendingInvites);
      setPendingAccessRequests(snap.pendingAccessRequests);
      setOrgPeers(snap.orgPeers);
      setProfileImagePathByUserId(snap.profileImagePathByUserId);
      setMessageAuthorByUserId(snap.messageAuthorByUserId);
      setTags(snap.tags);
      setOrgTagSuggestions(snap.orgTagSuggestions);
      setEmailNotificationsSubscribed(snap.emailNotificationsSubscribed);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, [selectedOrgId, shipmentId]);

  const applySavedTags = useCallback((savedTags: string[]) => {
    setTags(savedTags);
    setOrgTagSuggestions((prev) => {
      const merged = new Set(prev);
      for (const tag of savedTags) merged.add(tag);
      return [...merged].sort((a, b) => a.localeCompare(b));
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        messageAuthorByUserId[access.customer_user_id]?.trim() ||
        `User ${access.customer_user_id.slice(0, 8)}…`;
      return { access, label };
    });
  }, [customerAccessRows, messageAuthorByUserId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function updateAssignee(userId: string | null) {
    if (!selectedOrgId) return;
    setAssigneeSaving(true);
    try {
      await updateShipmentAssignee({
        shipmentId,
        organizationId: selectedOrgId,
        assigneeUserId: userId,
      });
      setAssigneeUserId(userId);
      toast("Assignee updated", "success");
      onMetaChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update assignee", "error");
    } finally {
      setAssigneeSaving(false);
    }
  }

  async function addParticipantUser(userId: string) {
    if (!userId || !selectedOrgId) return;
    setParticipantBusy(true);
    try {
      await insertShipmentParticipant({
        organizationId: selectedOrgId,
        shipmentId,
        userId,
      });
      toast("Participant added", "success");
      await load();
      onMetaChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not add participant", "error");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function removeParticipantRow(rowId: string) {
    setRemovingParticipantId(rowId);
    try {
      await deleteShipmentParticipantRow(rowId);
      toast("Participant removed", "success");
      await load();
      onMetaChanged();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove participant", "error");
    } finally {
      setRemovingParticipantId(null);
    }
  }

  const handleInviteEmailChange = useCallback((value: string) => {
    setInviteEmail(value);
    setInviteFieldError(null);
  }, []);

  async function createInvite() {
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
      const portalUrl = `${origin}/shipments/hub/${shipmentId}`;
      let successCount = 0;
      let singleInviteUrl: string | null = null;
      const failures: string[] = [];

      for (const email of emails) {
        const r = await createImporterInvite({
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
            ? portalUrl
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
      await load();

      if (successCount === 1 && singleInviteUrl) {
        setLastInviteUrl(singleInviteUrl);
      } else if (inviteDeliveryMode === "allowlist_only") {
        setLastInviteUrl(portalUrl);
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
            ? `${successCount} emails allowlisted — share the portal link with your importers.`
            : `${successCount} invite emails sent.`,
          "success",
        );
        return;
      }

      toast(
        inviteDeliveryMode === "allowlist_only"
          ? "Email allowlisted — share the portal link with your importer."
          : "Invite email sent — copy the link below if needed.",
        "success",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create invite", "error");
    } finally {
      setInviteCreating(false);
    }
  }

  async function resolveAccessRequestRow(accessRequestId: string, action: "approve" | "deny") {
    setResolvingRequestId(accessRequestId);
    try {
      const r = await resolveCustomerAccessRequest({ accessRequestId, action });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      toast(action === "approve" ? "Access approved and invite sent." : "Request denied.", "success");
      await load();
      onMetaChanged();
    } finally {
      setResolvingRequestId(null);
    }
  }

  async function revokeInviteRow(id: string): Promise<void> {
    await revokeCustomerInviteRow(id);
    await load();
  }

  async function revokeAccessRow(id: string): Promise<void> {
    await revokeShipmentCustomerAccessRow(id);
    await load();
  }

  return {
    selectedOrgId,
    loading,

    assigneeUserId,
    assigneeSaving,
    assigneeSelectOptions,
    updateAssignee,

    participantBusy,
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
    load,
    toast,

    tags,
    orgTagSuggestions,
    applySavedTags,
    emailNotificationsSubscribed,
  } as const;
}

export type ShipmentAccessTabContentState = ReturnType<typeof useShipmentAccessTabContent>;
