"use client";

import { X } from "lucide-react";
import { CustomerAccessPanel } from "../CustomerAccessPanel";
import { CustomMenuSelect, CustomSelect } from "@/components/CustomSelect";
import { UserAvatar } from "@/components/UserAvatar";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import { useShipmentAccessTabContent } from "./hooks/useShipmentAccessTabContent";

export function ShipmentAccessTabContent({
  shipmentId,
  initialAssigneeUserId,
  onMetaChanged,
}: {
  shipmentId: string;
  initialAssigneeUserId: string | null;
  onMetaChanged: () => void;
}) {
  const {
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
  } = useShipmentAccessTabContent({ shipmentId, initialAssigneeUserId, onMetaChanged });

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
                          imageUrl={getProfileImagePublicUrlBrowser(
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
