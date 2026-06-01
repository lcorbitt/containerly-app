"use client";

import { useEffect, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { updateCommercialShipment } from "@/services/shipment.service";
import {
  SHIPMENT_MAIL_TRACKING_INPUT_CLASS,
  SHIPMENT_MAIL_TRACKING_LABEL_CLASS,
  SHIPMENT_MAIL_TRACKING_PANEL_CLASS,
  SHIPMENT_MAIL_TRACKING_SAVE_BUTTON_CLASS,
} from "./constants";

export function ShipmentMailTrackingPanel({
  shipmentId,
  initialTrackingNumber,
  enabled = false,
  readOnly = false,
  onSaved,
}: {
  shipmentId: string;
  initialTrackingNumber?: string | null;
  /** Post-approval: show save action. Pre-approval: disabled placeholder only. */
  enabled?: boolean;
  readOnly?: boolean;
  onSaved?: () => void;
}) {
  const { selectedOrgId } = useOrganizationWorkspace();
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTrackingNumber(initialTrackingNumber ?? "");
  }, [initialTrackingNumber]);

  const savedNumber = initialTrackingNumber?.trim() ?? "";
  const canEdit = enabled && !readOnly;

  async function save() {
    if (!selectedOrgId || !canEdit) return;
    setSaving(true);
    try {
      const r = await updateCommercialShipment({
        organization_id: selectedOrgId,
        shipment_id: shipmentId,
        physical_mail_tracking_number: trackingNumber.trim() || null,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      toast("Mail tracking saved — customer notified.", "success");
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={SHIPMENT_MAIL_TRACKING_PANEL_CLASS}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <label className={SHIPMENT_MAIL_TRACKING_LABEL_CLASS}>
          Tracking Number
          <input
            type="text"
            value={canEdit ? trackingNumber : savedNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            disabled={!canEdit}
            placeholder={
              enabled
                ? "USPS / FedEx / DHL number"
                : "Available after draft documents approval…"
            }
            className={SHIPMENT_MAIL_TRACKING_INPUT_CLASS}
          />
        </label>
        {canEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className={SHIPMENT_MAIL_TRACKING_SAVE_BUTTON_CLASS}
          >
            {saving ? "Saving…" : "Save & Notify Customer"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
