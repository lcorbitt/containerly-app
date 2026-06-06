"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/contexts/toast";
import { updateCommercialShipment } from "@/services/shipment.service";
import {
  SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_CLASS,
  SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_POST_APPROVAL,
  SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_PRE_APPROVAL,
  SHIPMENT_MAIL_TRACKING_CUSTOMER_VALUE_CLASS,
  SHIPMENT_MAIL_TRACKING_DISPLAY_LABEL_CLASS,
  SHIPMENT_MAIL_TRACKING_INPUT_CLASS,
  SHIPMENT_MAIL_TRACKING_LABEL_CLASS,
  SHIPMENT_MAIL_TRACKING_PANEL_CLASS,
  SHIPMENT_MAIL_TRACKING_SAVE_BUTTON_CLASS,
  SHIPMENT_MAIL_TRACKING_TITLE,
} from "./constants";

function ShipmentMailTrackingCustomerDisplay({
  trackingNumber,
  postApproval,
}: {
  trackingNumber: string;
  postApproval: boolean;
}) {
  const hasTrackingNumber = trackingNumber.length > 0;

  return (
    <div className={SHIPMENT_MAIL_TRACKING_PANEL_CLASS}>
      <div className="min-w-0">
        <p className={SHIPMENT_MAIL_TRACKING_DISPLAY_LABEL_CLASS}>{SHIPMENT_MAIL_TRACKING_TITLE}</p>
        {hasTrackingNumber ? (
          <p className={SHIPMENT_MAIL_TRACKING_CUSTOMER_VALUE_CLASS}>{trackingNumber}</p>
        ) : (
          <p className={SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_CLASS}>
            {postApproval
              ? SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_POST_APPROVAL
              : SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_PRE_APPROVAL}
          </p>
        )}
      </div>
    </div>
  );
}

export function ShipmentMailTrackingPanel({
  shipmentId,
  organizationId,
  initialTrackingNumber,
  enabled = false,
  readOnly = false,
  onSaved,
}: {
  shipmentId: string;
  organizationId: string;
  initialTrackingNumber?: string | null;
  /** Post-approval: show save action. Pre-approval: disabled placeholder only. */
  enabled?: boolean;
  readOnly?: boolean;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTrackingNumber(initialTrackingNumber ?? "");
  }, [initialTrackingNumber]);

  const savedNumber = initialTrackingNumber?.trim() ?? "";
  const canEdit = enabled && !readOnly;

  if (readOnly) {
    return (
      <ShipmentMailTrackingCustomerDisplay trackingNumber={savedNumber} postApproval={enabled} />
    );
  }

  async function save() {
    if (!organizationId || !canEdit) return;
    setSaving(true);
    try {
      const r = await updateCommercialShipment({
        organization_id: organizationId,
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
          {SHIPMENT_MAIL_TRACKING_TITLE}
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
