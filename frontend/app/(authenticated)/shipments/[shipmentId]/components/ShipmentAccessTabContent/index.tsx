"use client";

import { X } from "lucide-react";
import { CustomerAccessPanel } from "../CustomerAccessPanel";
import { CustomMenuSelect, CustomSelect } from "@/components/CustomSelect";
import { UserAvatar } from "@/components/UserAvatar";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ShipmentAccessTabContentState } from "./hooks/useShipmentAccessTabContent";

export function ShipmentAccessTabContent({
  variant = "panel",
  state,
  shipmentId,
  onMetaChanged,
}: {
  /** `sidebar` — right column on shipment header; `header` kept for legacy two-column in-panel layout. */
  variant?: "panel" | "header" | "sidebar";
  state: ShipmentAccessTabContentState;
  shipmentId?: string;
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
    inviteDeliveryMode,
    setInviteDeliveryMode,
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
  } = state;

  if (!selectedOrgId) {
    return <p className="p-4 text-sm text-zinc-500">Select an organization.</p>;
  }

  const isHeader = variant === "header";
  const isSidebar = variant === "sidebar";

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">
        {isSidebar ? "Loading…" : "Loading team and importer access…"}
      </p>
    );
  }

  return (
    <div
      className={
        isSidebar
          ? "flex flex-col gap-4"
          : isHeader
            ? "grid gap-4 lg:grid-cols-2"
            : "flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain p-4 sm:p-5"
      }
    >
      <section
        className={
          isSidebar
            ? undefined
            : isHeader
              ? "rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
              : "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        }
      >
        <div className="space-y-5">
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

      {!isSidebar ? (
        <section
          className={
            isHeader
              ? "min-h-0 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
              : "min-h-0 flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          }
        >
          <CustomerAccessPanel
            variant="panel"
            inviteEmail={inviteEmail}
            onInviteEmailChange={setInviteEmail}
            deliveryMode={inviteDeliveryMode}
            onDeliveryModeChange={setInviteDeliveryMode}
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
      ) : null}
    </div>
  );
}
