"use client";

import { useState } from "react";
import { useConfirm } from "@/contexts/confirm-dialog";
import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import { UserAvatar } from "@/components/UserAvatar";
import { ShipmentShareImporterSettingsDialog } from "../ShipmentShareImporterSettingsDialog";
import type { ShipmentShareAccessRow } from "../types";
import {
  SHIPMENT_SHARE_PEOPLE_LIST_ACTION_CLASS,
  SHIPMENT_SHARE_PEOPLE_LIST_ITEM_CLASS,
  SHIPMENT_SHARE_PEOPLE_LIST_ROLE_CLASS,
} from "./constants";

export interface ShipmentSharePeopleListProps {
  rows: ShipmentShareAccessRow[];
  state: ShipmentAccessTabContentState;
}

export function ShipmentSharePeopleList({ rows, state }: ShipmentSharePeopleListProps) {
  const { confirm } = useConfirm();
  const [settingsRow, setSettingsRow] = useState<ShipmentShareAccessRow | null>(null);

  async function revokePendingInvite(id: string) {
    const ok = await confirm({
      title: "Revoke invite?",
      description: "They won't be able to accept this invite anymore.",
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    await state.revokeInviteRow(id);
  }

  async function revokeActiveAccess(id: string) {
    const ok = await confirm({
      title: "Revoke importer access?",
      description: "They will no longer see this shipment or documents.",
      confirmLabel: "Revoke",
      cancelLabel: "Cancel",
      variant: "danger",
    });
    if (!ok) return;
    await state.revokeAccessRow(id);
  }

  return (
    <>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.id} className={SHIPMENT_SHARE_PEOPLE_LIST_ITEM_CLASS}>
            <span className="flex min-w-0 items-center gap-2.5">
              <UserAvatar imageUrl={row.avatarUrl} label={row.label} size="md" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {row.label}
                </span>
                {row.sublabel ? (
                  <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">{row.sublabel}</span>
                ) : null}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span className={SHIPMENT_SHARE_PEOPLE_LIST_ROLE_CLASS}>{row.role}</span>
              {row.kind === "pending" ? (
                <button
                  type="button"
                  className={SHIPMENT_SHARE_PEOPLE_LIST_ACTION_CLASS}
                  onClick={() => void revokePendingInvite(row.id)}
                >
                  Revoke
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={SHIPMENT_SHARE_PEOPLE_LIST_ACTION_CLASS}
                    onClick={() => setSettingsRow(row)}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className={SHIPMENT_SHARE_PEOPLE_LIST_ACTION_CLASS}
                    onClick={() => void revokeActiveAccess(row.id)}
                  >
                    Remove
                  </button>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>

      {settingsRow?.kind === "active" && settingsRow.access ? (
        <ShipmentShareImporterSettingsDialog
          access={settingsRow.access}
          granteeLabel={settingsRow.label}
          open
          onClose={() => setSettingsRow(null)}
          onSaved={() => void state.load()}
        />
      ) : null}
    </>
  );
}
