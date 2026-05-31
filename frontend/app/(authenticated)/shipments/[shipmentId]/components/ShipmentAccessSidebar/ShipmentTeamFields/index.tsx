"use client";

import { X } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import type { ShipmentAccessTabContentState } from "../../ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { ShipmentSidebarSettingsRow } from "../ShipmentSidebarSettingsRow";
import { SIDEBAR_SETTINGS_EMPTY_CLASS } from "../ShipmentSidebarSettingsRow/constants";
import { ShipmentSidebarUserPicker } from "../ShipmentSidebarUserPicker";
import { shipmentUserDisplayLabel } from "./utils";

export function ShipmentTeamFields({ state }: { state: ShipmentAccessTabContentState }) {
  const {
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
  } = state;

  const assigneeLabel = assigneeUserId
    ? shipmentUserDisplayLabel(assigneeUserId, messageAuthorByUserId)
    : null;

  return (
    <>
      <ShipmentSidebarSettingsRow
        label="Assignee"
        summary={
          assigneeUserId && assigneeLabel ? (
            <span className="flex min-w-0 items-center gap-2">
              <UserAvatar
                imageUrl={getProfileImagePublicUrlBrowser(
                  profileImagePathByUserId[assigneeUserId] ?? null,
                )}
                label={assigneeLabel}
              />
              <span className="min-w-0 truncate text-sm text-zinc-800 dark:text-zinc-200">
                {assigneeLabel}
              </span>
            </span>
          ) : (
            <p className={SIDEBAR_SETTINGS_EMPTY_CLASS}>No assignee</p>
          )
        }
      >
        {({ close }) => (
          <ShipmentSidebarUserPicker
            hint="Choose who is responsible for this shipment."
            options={assigneeSelectOptions}
            selectedValue={assigneeUserId}
            disabled={assigneeSaving}
            onPick={(userId) => {
              void updateAssignee(userId || null);
              close();
            }}
          />
        )}
      </ShipmentSidebarSettingsRow>

      <ShipmentSidebarSettingsRow
        label="Participants"
        summary={
          participantRowsWithoutAssignee.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {participantRowsWithoutAssignee.map((row) => {
                const label = shipmentUserDisplayLabel(row.user_id, messageAuthorByUserId);
                return (
                  <li key={row.id} className="flex min-w-0 items-center gap-2">
                    <UserAvatar
                      imageUrl={getProfileImagePublicUrlBrowser(
                        profileImagePathByUserId[row.user_id] ?? null,
                      )}
                      label={label}
                    />
                    <span className="min-w-0 truncate text-sm text-zinc-800 dark:text-zinc-200">
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={SIDEBAR_SETTINGS_EMPTY_CLASS}>None</p>
          )
        }
      >
        <ShipmentSidebarUserPicker
          hint="Add team members who can collaborate on this shipment."
          options={participantsMenuOptions}
          disabled={participantBusy}
          onPick={(userId) => void addParticipantUser(userId)}
        />
        {participantRowsWithoutAssignee.length > 0 ? (
          <ul className="mt-3 flex flex-col gap-0.5 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            {participantRowsWithoutAssignee.map((row) => {
              const label = shipmentUserDisplayLabel(row.user_id, messageAuthorByUserId);
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
      </ShipmentSidebarSettingsRow>
    </>
  );
}
