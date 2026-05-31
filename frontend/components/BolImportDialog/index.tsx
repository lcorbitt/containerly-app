"use client";

import { CheckboxTile } from "@/components/CheckboxTile";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { CustomSelect } from "@/components/CustomSelect";
import { JSONCARGO_CARRIER_SELECT_OPTIONS } from "@/utils/jsoncargo-carrier-options";
import { useBolImportDialog } from "./hooks/useBolImportDialog";

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
  const {
    carrierSelectId,
    bol,
    setBol,
    carrierLookupOverride,
    carrierPanelOpen,
    lookupBusy,
    importBusy,
    numbers,
    lineName,
    shippingLineParam,
    selected,
    inputsDisabled,
    handleClose,
    runLookup,
    runImport,
    openCarrierPanel,
    cancelCarrierPanel,
    clearCarrierOverride,
    handleCarrierSelect,
    toggleContainer,
  } = useBolImportDialog({ organizationId, onClose, onImported });

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
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Bulk carrier import (premium)
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Optional after document approval: one BOL can list many container numbers. We create one shipment with a
              carrier sync line per unit — use only when live API tracking is enabled for the move.
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
            disabled={inputsDisabled}
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
                  disabled={inputsDisabled}
                  onClick={openCarrierPanel}
                  className="font-medium text-zinc-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-zinc-300"
                >
                  Change
                </button>
                <button
                  type="button"
                  disabled={inputsDisabled}
                  onClick={clearCarrierOverride}
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
                  onValueChange={handleCarrierSelect}
                  options={JSONCARGO_CARRIER_SELECT_OPTIONS}
                  placeholderLabel="Select carrier"
                  disabled={inputsDisabled}
                  className="w-full"
                />
              </div>
              <button
                type="button"
                disabled={inputsDisabled}
                onClick={cancelCarrierPanel}
                className="mt-2 text-xs font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </div>
          ) : !carrierLookupOverride ? (
            <button
              type="button"
              disabled={inputsDisabled}
              onClick={openCarrierPanel}
              className="text-xs font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Specify carrier for lookup (only if your API requires it)
            </button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={inputsDisabled}
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
                    onCheckedChange={(next) => toggleContainer(n, next)}
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
