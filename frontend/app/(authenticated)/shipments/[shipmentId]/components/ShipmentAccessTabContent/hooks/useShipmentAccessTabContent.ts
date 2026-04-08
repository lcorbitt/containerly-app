"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createImporterInvite,
  deleteShipmentParticipantRow,
  fetchShipmentAccessTabSnapshotForBrowser,
  insertShipmentParticipant,
  revokeCustomerInviteRow,
  revokeShipmentCustomerAccessRow,
  updateShipmentAssignee,
} from "@/services/shipment.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentParticipant,
} from "@/types/database";
import type { CustomSelectOption } from "@/components/CustomSelect";

export function useShipmentAccessTabContent({
  shipmentId,
  initialAssigneeUserId,
  onMetaChanged,
}: {
  shipmentId: string;
  initialAssigneeUserId: string | null;
  onMetaChanged: () => void;
}) {
  const { toast } = useToast();
  const { selectedOrgId } = useOrganizationWorkspace();
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
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCreating, setInviteCreating] = useState(false);
  const [messageAuthorByUserId, setMessageAuthorByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAssigneeUserId(initialAssigneeUserId);
  }, [initialAssigneeUserId, shipmentId]);

  const load = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    try {
      const snap = await fetchShipmentAccessTabSnapshotForBrowser({
        shipmentId,
        organizationId: selectedOrgId,
      });
      setAssigneeUserId(snap.assigneeUserId);
      setParticipantRows(snap.participantRows);
      setCustomerAccessRows(snap.customerAccessRows);
      setPendingInvites(snap.pendingInvites);
      setOrgPeers(snap.orgPeers);
      setProfileImagePathByUserId(snap.profileImagePathByUserId);
      setMessageAuthorByUserId(snap.messageAuthorByUserId);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, shipmentId]);

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

  async function createInvite() {
    if (!selectedOrgId) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      toast("Enter the importer's email address.", "error");
      return;
    }
    setInviteCreating(true);
    try {
      const r = await createImporterInvite({
        organizationId: selectedOrgId,
        shipmentId,
        invitedEmail: email,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      const fullUrl = r.invite_url.startsWith("http") ? r.invite_url : `${origin}${r.invite_url}`;
      setLastInviteUrl(fullUrl);
      setInviteEmail("");
      await load();
      toast("Invite created — copy the link below for your importer.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create invite", "error");
    } finally {
      setInviteCreating(false);
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
    setInviteEmail,
    inviteCreating,
    lastInviteUrl,
    setLastInviteUrl,
    pendingInvites,
    activeAccessWithLabels,
    origin,
    createInvite,
    revokeInviteRow,
    revokeAccessRow,
    load,
    toast,
  } as const;
}
