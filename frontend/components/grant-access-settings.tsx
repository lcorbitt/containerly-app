"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { previewImporterPortalShipment } from "@/lib/supabase/operator-shipment-edge";
import { useToast } from "@/contexts/toast";
import type { ShipmentCustomerAccess } from "@/types/database";
import type { PublicReportPayload } from "@/types/public-report";
import { DialogCloseButton } from "@/components/dialog-close-button";
import { PublicContainerReport } from "@/components/public-container-report";

const DEFAULT_VIS = {
  include_raw_external: false,
  include_alerts: true,
  show_bill_of_lading: false,
  show_ais_enrichment: true,
  show_carrier_timeline: true,
};

function mergeVis(raw: Record<string, unknown> | undefined): Record<string, boolean> {
  return {
    include_raw_external: Boolean(raw?.include_raw_external),
    include_alerts: raw?.include_alerts !== false,
    show_bill_of_lading: raw?.show_bill_of_lading === true,
    show_ais_enrichment: raw?.show_ais_enrichment !== false,
    show_carrier_timeline: raw?.show_carrier_timeline !== false,
  };
}

export function GrantAccessSettingsEditor({
  access,
  granteeLabel,
  onSaved,
}: {
  access: ShipmentCustomerAccess;
  granteeLabel: string;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vis, setVis] = useState(() => mergeVis(access.visibility_settings ?? undefined));
  const [ov, setOv] = useState<Record<string, string>>(() => {
    const o = (access.operator_overrides ?? undefined) as Record<string, unknown> | undefined;
    return {
      customer_note: typeof o?.customer_note === "string" ? o.customer_note : "",
      display_eta: typeof o?.display_eta === "string" ? o.display_eta : "",
      display_status_label: typeof o?.display_status_label === "string" ? o.display_status_label : "",
      display_last_location: typeof o?.display_last_location === "string" ? o.display_last_location : "",
    };
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<PublicReportPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const visibilityPayload = useCallback(
    () => ({
      ...DEFAULT_VIS,
      ...vis,
    }),
    [vis],
  );

  const overridesPayload = useCallback(() => {
    const o: Record<string, string> = {};
    if (ov.customer_note.trim()) o.customer_note = ov.customer_note.trim();
    if (ov.display_eta.trim()) o.display_eta = ov.display_eta.trim();
    if (ov.display_status_label.trim()) o.display_status_label = ov.display_status_label.trim();
    if (ov.display_last_location.trim()) o.display_last_location = ov.display_last_location.trim();
    return o;
  }, [ov]);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shipment_customer_access")
        .update({
          visibility_settings: visibilityPayload(),
          operator_overrides: overridesPayload(),
        })
        .eq("id", access.id);
      if (error) throw new Error(error.message);
      toast("Importer portal settings saved", "success");
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function openPreview() {
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const r = await previewImporterPortalShipment({
        shipmentId: access.shipment_id,
        visibilitySettings: visibilityPayload(),
        operatorOverrides: overridesPayload(),
      });
      if (!r.ok) {
        setPreviewPayload(null);
        toast(r.error, "error");
        return;
      }
      setPreviewPayload(r.data);
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{granteeLabel}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">What this importer sees on their shipment page</p>

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
          Note on importer portal
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
          Preview importer portal
        </button>
      </div>

      {previewOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
          aria-label="Importer portal preview"
        >
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Importer portal preview</p>
              <DialogCloseButton
                onClick={() => {
                  setPreviewOpen(false);
                  setPreviewPayload(null);
                }}
              />
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
