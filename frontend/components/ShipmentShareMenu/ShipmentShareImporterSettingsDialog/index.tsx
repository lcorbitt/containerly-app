"use client";

import { DialogCloseButton } from "@/components/DialogCloseButton";
import { GrantAccessSettingsEditor } from "@/app/(authenticated)/shipments/[shipmentId]/components/GrantAccessSettings";
import type { ShipmentCustomerAccess } from "@/types/database";
import {
  SHIPMENT_SHARE_IMPORTER_SETTINGS_DIALOG_CLASS,
  SHIPMENT_SHARE_IMPORTER_SETTINGS_DIALOG_PANEL_CLASS,
  SHIPMENT_SHARE_IMPORTER_SETTINGS_DIALOG_TITLE,
} from "./constants";

export interface ShipmentShareImporterSettingsDialogProps {
  access: ShipmentCustomerAccess;
  granteeLabel: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ShipmentShareImporterSettingsDialog({
  access,
  granteeLabel,
  open,
  onClose,
  onSaved,
}: ShipmentShareImporterSettingsDialogProps) {
  if (!open) return null;

  return (
    <div
      className={SHIPMENT_SHARE_IMPORTER_SETTINGS_DIALOG_CLASS}
      role="dialog"
      aria-modal
      aria-label={`Customer Settings for ${granteeLabel}`}
    >
      <div className={SHIPMENT_SHARE_IMPORTER_SETTINGS_DIALOG_PANEL_CLASS}>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {SHIPMENT_SHARE_IMPORTER_SETTINGS_DIALOG_TITLE}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{granteeLabel}</p>
          </div>
          <DialogCloseButton onClick={onClose} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <GrantAccessSettingsEditor access={access} granteeLabel={granteeLabel} onSaved={onSaved} />
        </div>
      </div>
    </div>
  );
}
