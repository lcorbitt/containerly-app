"use client";

import { useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { updateCommercialShipment } from "@/services/shipment.service";

export function ShipmentMailTrackingPanel({
  shipmentId,
  initialTrackingNumber,
  readOnly = false,
  onSaved,
}: {
  shipmentId: string;
  initialTrackingNumber: string | null | undefined;
  readOnly?: boolean;
  onSaved?: () => void;
}) {
  const { selectedOrgId } = useOrganizationWorkspace();
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!selectedOrgId) return;
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

  const savedNumber = initialTrackingNumber?.trim() ?? "";

  if (readOnly) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Original documents mailed</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Optional physical mail tracking number shown on the customer portal.
        </p>
        <label className="mt-3 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Tracking Number
          <input
            type="text"
            disabled
            value={savedNumber}
            placeholder="Not provided yet"
            className="mt-1 w-full cursor-not-allowed rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 disabled:opacity-100 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300"
          />
        </label>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Original documents mailed</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Optional physical mail tracking number shown on the customer portal.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Tracking Number
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="USPS / FedEx / DHL number"
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Saving…" : "Save & notify customer"}
        </button>
      </div>
    </div>
  );
}
