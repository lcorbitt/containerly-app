"use client";

import type { ShipmentCustomerAccess } from "@/types/database";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { PublicContainerReport } from "@/components/PublicContainerReport";
import { useGrantAccessSettings } from "./hooks/useGrantAccessSettings";

export function GrantAccessSettingsEditor({
  access,
  granteeLabel,
  onSaved,
}: {
  access: ShipmentCustomerAccess;
  granteeLabel: string;
  onSaved: () => void;
}) {
  const {
    saving,
    vis,
    setVis,
    ov,
    setOv,
    previewOpen,
    previewPayload,
    previewLoading,
    save,
    openPreview,
    closePreview,
  } = useGrantAccessSettings({ access, onSaved });

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{granteeLabel}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">What this customer sees on their shipment page</p>

      <fieldset className="mt-4 space-y-2 text-sm">
        <legend className="sr-only">Visibility</legend>
        {(
          [
            ["include_alerts", "Show alerts"],
            ["include_raw_external", "Show raw carrier JSON (advanced)"],
            ["show_bill_of_lading", "Show bill of lading on context"],
            ["show_ais_enrichment", "Show live vessel (AIS) block"],
            ["show_carrier_timeline", "Show event timeline"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={vis[key]}
              onChange={(e) => setVis((v) => ({ ...v, [key]: e.target.checked }))}
            />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>

      <div className="mt-4 space-y-2">
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Note on customer portal
          <textarea
            value={ov.customer_note}
            onChange={(e) => setOv((o) => ({ ...o, customer_note: e.target.value }))}
            rows={2}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Short update shown at top of their view"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Override status label (optional)
          <input
            value={ov.display_status_label}
            onChange={(e) => setOv((o) => ({ ...o, display_status_label: e.target.value }))}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Override last location (optional)
          <input
            value={ov.display_last_location}
            onChange={(e) => setOv((o) => ({ ...o, display_last_location: e.target.value }))}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Override ETA text (optional)
          <input
            value={ov.display_eta}
            onChange={(e) => setOv((o) => ({ ...o, display_eta: e.target.value }))}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="e.g. Expected week of Mar 3"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => void openPreview()}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
        >
          Preview Customer Portal
        </button>
      </div>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
          aria-label="Customer portal preview"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Customer Portal Preview</p>
              <DialogCloseButton onClick={closePreview} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {previewLoading ? (
                <p className="p-8 text-center text-sm text-zinc-500">Loading preview…</p>
              ) : previewPayload ? (
                <PublicContainerReport
                  shipmentId={access.shipment_id}
                  initial={previewPayload}
                  readOnlyMessaging
                />
              ) : (
                <p className="p-8 text-center text-sm text-red-600">Could not load preview.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
