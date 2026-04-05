"use client";

import { useId, useState } from "react";
import { createTrackingRequestAction } from "@/app/actions/edge-functions";
import { CheckboxTile } from "@/components/checkbox-tile";
import { DialogCloseButton } from "@/components/dialog-close-button";
import { CustomSelect } from "@/components/custom-select";
import { JSONCARGO_CARRIER_SELECT_OPTIONS } from "@/lib/jsoncargo-carrier-options";
import { lookupBolContainers } from "@/lib/supabase/operator-shipment-edge";
import { useToast } from "@/contexts/toast";

export function BolImportDialog({
  open,
  onClose,
  organizationId,
  onImported,
  stackZIndex = "z-50",
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onImported: () => void;
  /** Stacking above another dialog (e.g. track modal at z-[100]). */
  stackZIndex?: string;
}) {
  const { toast } = useToast();
  const carrierSelectId = useId();
  const [bol, setBol] = useState("");
  /** JSONCargo enum sent on BOL lookup when the API requires `shipping_line`. */
  const [carrierLookupOverride, setCarrierLookupOverride] = useState("");
  /** When true, show the carrier select (otherwise lookup uses BOL response only). */
  const [carrierPanelOpen, setCarrierPanelOpen] = useState(false);
  /** Value of `carrierLookupOverride` when the panel was opened (Cancel restores this). */
  const [carrierPanelSnapshot, setCarrierPanelSnapshot] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [lineName, setLineName] = useState<string | null>(null);
  /** JSONCargo carrier enum persisted on shipment and passed to each container sync. */
  const [shippingLineParam, setShippingLineParam] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function reset() {
    setBol("");
    setCarrierLookupOverride("");
    setCarrierPanelOpen(false);
    setCarrierPanelSnapshot("");
    setNumbers([]);
    setLineName(null);
    setShippingLineParam(null);
    setSelected({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function runLookup() {
    const q = bol.trim();
    if (!q) {
      toast("Enter a bill of lading number.", "error");
      return;
    }
    setLookupBusy(true);
    try {
      const r = await lookupBolContainers({
        organizationId,
        billOfLading: q,
        ...(carrierLookupOverride.trim() ? { shippingLine: carrierLookupOverride.trim() } : {}),
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      setNumbers(r.associated_container_numbers);
      setLineName(r.shipping_line_name);
      setShippingLineParam(r.shipping_line);
      const next: Record<string, boolean> = {};
      for (const n of r.associated_container_numbers) next[n] = true;
      setSelected(next);
      if (r.associated_container_numbers.length === 0) {
        toast("No containers returned for that BOL.", "info");
      }
    } finally {
      setLookupBusy(false);
    }
  }

  async function runImport() {
    const toCreate = numbers.filter((n) => selected[n]);
    if (toCreate.length === 0) {
      toast("Select at least one container.", "info");
      return;
    }
    const bolNorm = bol.trim();
    const shipmentGroupId = crypto.randomUUID();
    setImportBusy(true);
    let ok = 0;
    const failures: string[] = [];
    try {
      for (const container_number of toCreate) {
        try {
          await createTrackingRequestAction({
            organization_id: organizationId,
            container_number,
            run_sync: true,
            shipment_group_id: shipmentGroupId,
            source_bill_of_lading: bolNorm || undefined,
            ...(shippingLineParam?.trim()
              ? { shipping_line: shippingLineParam.trim() }
              : {}),
          });
          ok += 1;
        } catch (e) {
          failures.push(
            `${container_number}: ${e instanceof Error ? e.message : "failed"}`,
          );
        }
      }
      if (ok > 0) {
        toast(
          ok === 1 ? "Created 1 tracking request." : `Created ${ok} tracking requests.`,
          "success",
        );
        onImported();
      }
      if (failures.length > 0) {
        toast(failures.slice(0, 3).join(" · "), "error");
      }
      if (ok > 0) handleClose();
    } finally {
      setImportBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 ${stackZIndex} flex items-center justify-center bg-black/50 p-4`}
      role="dialog"
      aria-modal
      aria-label="Import from bill of lading"
    >
      <div className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Import from bill of lading</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Matches carrier data: one BOL lists many container numbers. We create{" "}
              <strong className="font-medium text-zinc-700 dark:text-zinc-300">one shipment</strong> with a{" "}
              <strong className="font-medium text-zinc-700 dark:text-zinc-300">container line</strong> per number,
              then sync each line the same way as tracking a single container (carrier container API per unit).
            </p>
          </div>
          <DialogCloseButton onClick={handleClose} />
        </div>

        <label className="mt-4 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
          Bill of lading
          <input
            value={bol}
            onChange={(e) => setBol(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="e.g. MEDUSH914201"
            disabled={lookupBusy || importBusy}
          />
        </label>

        <div className="mt-3">
          {carrierLookupOverride && !carrierPanelOpen ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900/40">
              <span className="text-zinc-600 dark:text-zinc-400">
                BOL lookup uses carrier{" "}
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                  {carrierLookupOverride}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={lookupBusy || importBusy}
                  onClick={() => {
                    setCarrierPanelSnapshot(carrierLookupOverride);
                    setCarrierPanelOpen(true);
                  }}
                  className="font-medium text-zinc-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-300"
                >
                  Change
                </button>
                <button
                  type="button"
                  disabled={lookupBusy || importBusy}
                  onClick={() => {
                    setCarrierLookupOverride("");
                    setCarrierPanelOpen(false);
                    setCarrierPanelSnapshot("");
                  }}
                  className="font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Clear
                </button>
              </span>
            </div>
          ) : null}

          {carrierPanelOpen ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-700 dark:bg-zinc-900/30">
              <span id={`${carrierSelectId}-label`} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Carrier for this BOL lookup
              </span>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Only needed when your tracking API requires a{" "}
                <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  shipping_line
                </code>{" "}
                on the bill-of-lading request.
              </p>
              <div className="mt-2 rounded-md border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
                <CustomSelect
                  id={carrierSelectId}
                  aria-labelledby={`${carrierSelectId}-label`}
                  showAvatars={false}
                  value={carrierLookupOverride}
                  onValueChange={(v) => {
                    setCarrierLookupOverride(v);
                    if (v) setCarrierPanelOpen(false);
                  }}
                  options={JSONCARGO_CARRIER_SELECT_OPTIONS}
                  placeholderLabel="Select carrier"
                  disabled={lookupBusy || importBusy}
                  className="w-full"
                />
              </div>
              <button
                type="button"
                disabled={lookupBusy || importBusy}
                onClick={() => {
                  setCarrierLookupOverride(carrierPanelSnapshot);
                  setCarrierPanelOpen(false);
                }}
                className="mt-2 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          ) : !carrierLookupOverride ? (
            <button
              type="button"
              disabled={lookupBusy || importBusy}
              onClick={() => {
                setCarrierPanelSnapshot(carrierLookupOverride);
                setCarrierPanelOpen(true);
              }}
              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Specify carrier for lookup (only if your API requires it)
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={lookupBusy || importBusy}
            onClick={() => void runLookup()}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {lookupBusy ? "Looking up…" : "Look up"}
          </button>
        </div>

        {numbers.length > 0 ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
              {lineName ? (
                <p>
                  Carrier (BOL):{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{lineName}</span>
                </p>
              ) : null}
              {shippingLineParam ? (
                <p>
                  Stored on shipment + container sync:{" "}
                  <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                    {shippingLineParam}
                  </span>
                </p>
              ) : (
                <p className="text-amber-800 dark:text-amber-200/90">
                  No JSONCargo carrier enum inferred—sync may omit{" "}
                  <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">
                    shipping_line
                  </code>
                  . Prefer BOL responses with carrier name/id, set{" "}
                  <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">
                    EXTERNAL_TRACKING_SHIPPING_LINE
                  </code>
                  , use{" "}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    Specify carrier for lookup
                  </span>{" "}
                  above, or pass{" "}
                  <code className="rounded bg-zinc-100 px-1 font-mono text-[10px] dark:bg-zinc-800">
                    shipping_line
                  </code>{" "}
                  on the request when the API requires it.
                </p>
              )}
            </div>
            <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Containers
            </p>
            <ul className="mt-2 flex max-h-52 flex-col gap-2 overflow-y-auto pr-0.5">
              {numbers.map((n) => (
                <li key={n} className="list-none">
                  <CheckboxTile
                    checked={selected[n] ?? false}
                    onCheckedChange={(next) => setSelected((s) => ({ ...s, [n]: next }))}
                    disabled={importBusy}
                  >
                    <span className="font-mono text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {n}
                    </span>
                  </CheckboxTile>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={importBusy}
              onClick={() => void runImport()}
              className="mt-4 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-emerald-600"
            >
              {importBusy ? "Creating…" : "Add selected containers to this shipment"}
            </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
