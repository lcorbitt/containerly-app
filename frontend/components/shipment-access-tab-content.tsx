"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { CustomerAccessPanel } from "@/components/customer-access-panel";
import { CustomMenuSelect, CustomSelect, type CustomSelectOption } from "@/components/custom-select";
import { UserAvatar } from "@/components/user-avatar";
import { createImporterInvite } from "@/lib/supabase/shipment-edge";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { profileDisplayName } from "@/lib/author-display-name";
import { getProfileImagePublicUrl } from "@/lib/profile-image";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentParticipant,
} from "@/types/database";

export function ShipmentAccessTabContent({
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

  const supabaseForAvatarUrls = useMemo(() => createClient(), []);

  useEffect(() => {
    setAssigneeUserId(initialAssigneeUserId);
  }, [initialAssigneeUserId, shipmentId]);

  const load = useCallback(async () => {
    if (!selectedOrgId) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const [
        { data: ship },
        { data: parts },
        { data: orgMemberRows },
        { data: accessRows },
        { data: invRows },
      ] = await Promise.all([
        supabase
          .from("shipments")
          .select("assignee_user_id")
          .eq("id", shipmentId)
          .eq("organization_id", selectedOrgId)
          .maybeSingle(),
        supabase
          .from("shipment_participants")
          .select("*")
          .eq("shipment_id", shipmentId)
          .order("created_at", { ascending: true }),
        supabase.from("organization_members").select("user_id").eq("organization_id", selectedOrgId),
        supabase
          .from("shipment_customer_access")
          .select("*")
          .eq("shipment_id", shipmentId)
          .is("revoked_at", null)
          .order("created_at", { ascending: false }),
        supabase
          .from("customer_invites")
          .select("*")
          .eq("shipment_id", shipmentId)
          .eq("status", "pending")
          .order("created_at", { ascending: false }),
      ]);
      setAssigneeUserId((ship?.assignee_user_id as string | null) ?? null);
      setParticipantRows((parts as ShipmentParticipant[]) ?? []);
      setCustomerAccessRows((accessRows as ShipmentCustomerAccess[]) ?? []);
      setPendingInvites((invRows as CustomerInvite[]) ?? []);

      const imagePathByUser: Record<string, string | null> = {};
      const orgUserIds = [...new Set((orgMemberRows ?? []).map((m) => m.user_id as string))];
      if (orgUserIds.length > 0) {
        const { data: peerProfs } = await supabase
          .from("profiles")
          .select("id, email, full_name, profile_image_path")
          .in("id", orgUserIds);
        const peers =
          (peerProfs ?? []).map((p) => ({
            id: p.id as string,
            label: profileDisplayName({
              full_name: p.full_name as string | null,
              email: p.email as string | null,
            }),
          })) ?? [];
        peers.sort((a, b) => a.label.localeCompare(b.label));
        setOrgPeers(peers);
        for (const p of peerProfs ?? []) {
          const uid = p.id as string;
          const path = p.profile_image_path as string | null | undefined;
          imagePathByUser[uid] = path?.trim() ? path : null;
        }
      } else {
        setOrgPeers([]);
      }
      setProfileImagePathByUserId(imagePathByUser);

      const customerIds = (accessRows ?? []).map((a) => (a as ShipmentCustomerAccess).customer_user_id);
      const participantIds = (parts ?? []).map((p) => (p as ShipmentParticipant).user_id);
      const assigneeId = (ship?.assignee_user_id as string | null) ?? null;
      const profileIds = [
        ...new Set([...customerIds, ...participantIds, ...(assigneeId ? [assigneeId] : [])]),
      ];
      const nameByUser: Record<string, string> = {};
      if (profileIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, email, full_name")
          .in("id", profileIds);
        for (const p of profs ?? []) {
          nameByUser[p.id as string] = profileDisplayName({
            full_name: p.full_name as string | null,
            email: p.email as string | null,
          });
        }
      }
      setMessageAuthorByUserId(nameByUser);
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
        avatarUrl: getProfileImagePublicUrl(
          supabaseForAvatarUrls,
          profileImagePathByUserId[p.id] ?? null,
        ),
      })),
    ];
  }, [orgPeers, profileImagePathByUserId, supabaseForAvatarUrls]);

  const participantsMenuOptions = useMemo((): CustomSelectOption[] => {
    return peersAvailableToAdd.map((p) => ({
      value: p.id,
      label: p.label,
      avatarUrl: getProfileImagePublicUrl(
        supabaseForAvatarUrls,
        profileImagePathByUserId[p.id] ?? null,
      ),
    }));
  }, [peersAvailableToAdd, profileImagePathByUserId, supabaseForAvatarUrls]);

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
      const supabase = createClient();
      const { error } = await supabase
        .from("shipments")
        .update({ assignee_user_id: userId })
        .eq("id", shipmentId)
        .eq("organization_id", selectedOrgId);
      if (error) throw new Error(error.message);
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
    if (!userId) return;
    setParticipantBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("shipment_participants").insert({
        shipment_id: shipmentId,
        user_id: userId,
      });
      if (error && error.code !== "23505") throw new Error(error.message);
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
      const supabase = createClient();
      const { error } = await supabase.from("shipment_participants").delete().eq("id", rowId);
      if (error) throw new Error(error.message);
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
      toast("Enter the importer’s email address.", "error");
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
    const supabase = createClient();
    const { error } = await supabase.from("customer_invites").update({ status: "revoked" }).eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  async function revokeAccessRow(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("shipment_customer_access")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(error.message);
    await load();
  }

  if (!selectedOrgId) {
    return <p className="p-4 text-sm text-zinc-500">Select an organization.</p>;
  }

  if (loading) {
    return <p className="p-4 text-sm text-zinc-500">Loading access…</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4 sm:p-5">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Shipment team</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Assignee and participants apply to the whole shipment (all container lines).
        </p>
        <div className="mt-4 space-y-5">
          <div>
            <label
              id="shipment-assignee-label"
              className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
            >
              Assignee
            </label>
            <CustomSelect
              aria-labelledby="shipment-assignee-label"
              value={assigneeUserId ?? ""}
              disabled={assigneeSaving}
              onValueChange={(v) => void updateAssignee(v || null)}
              options={assigneeSelectOptions}
              className="mt-1.5"
            />
          </div>
          <div>
            <label
              id="shipment-participants-label"
              className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
            >
              Participants
            </label>
            <CustomMenuSelect
              id="shipment-add-participant"
              aria-labelledby="shipment-participants-label"
              placeholder="Add participant…"
              disabledPlaceholder="No one else to add"
              options={participantsMenuOptions}
              disabled={participantBusy}
              busy={participantBusy}
              onPick={(userId) => void addParticipantUser(userId)}
              className="mt-1.5"
            />
            {participantRowsWithoutAssignee.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-0.5">
                {participantRowsWithoutAssignee.map((row) => {
                  const label =
                    messageAuthorByUserId[row.user_id]?.trim() ||
                    `User ${row.user_id.slice(0, 8)}…`;
                  return (
                    <li
                      key={row.id}
                      className="flex items-center justify-between gap-2 rounded-md py-1.5 pr-1"
                    >
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <UserAvatar
                          imageUrl={getProfileImagePublicUrl(
                            supabaseForAvatarUrls,
                            profileImagePathByUserId[row.user_id] ?? null,
                          )}
                          label={label}
                        />
                        <span className="min-w-0 truncate text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {label}
                        </span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Remove ${label} from participants`}
                        disabled={removingParticipantId === row.id}
                        onClick={() => void removeParticipantRow(row.id)}
                        className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <CustomerAccessPanel
          inviteEmail={inviteEmail}
          onInviteEmailChange={setInviteEmail}
          creating={inviteCreating}
          onCreateInvite={() => void createInvite()}
          lastInviteUrl={lastInviteUrl}
          onClearLastInviteUrl={() => setLastInviteUrl(null)}
          pendingInvites={pendingInvites}
          activeAccess={activeAccessWithLabels}
          origin={origin}
          onRevokeInvite={revokeInviteRow}
          onRevokeAccess={revokeAccessRow}
          onToast={toast}
          onReloadAccess={() => load()}
        />
      </section>
    </div>
  );
}
