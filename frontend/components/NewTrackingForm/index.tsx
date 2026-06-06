"use client";

import { CustomSelect } from "@/components/CustomSelect";
import { RadioGroup, RadioTile } from "@/components/Radio";
import { useNewTrackingForm } from "./hooks/useNewTrackingForm";
import { JSONCARGO_CONTAINER_DOCS } from "./constants";

export function NewTrackingForm({
  organizationId,
  onCreated,
  onOpenBolImport,
  showChrome = true,
  className: formClassName,
  fixedShipmentId,
  premiumMode = false,
}: {
  organizationId: string;
  onCreated: () => void;
  /** Bulk import for multiple container numbers (advanced). */
  onOpenBolImport?: () => void;
  showChrome?: boolean;
  className?: string;
  fixedShipmentId?: string;
  /** Simplified copy for post-approval carrier sync from shipment workspace. */
  premiumMode?: boolean;
}) {
  const {
    trackingNumber,
    setTrackingNumber,
    shippingLine,
    setShippingLine,
    shipmentMode,
    setShipmentMode,
    orderNumber,
    setOrderNumber,
    existingShipmentId,
    setExistingShipmentId,
    shipmentSelectOptions,
    shipmentsLoading,
    shipmentsError,
    shipments,
    error,
    loading,
    submitDisabled,
    submit,
    fixedShipmentId: lockedShipmentId,
  } = useNewTrackingForm({ organizationId, onCreated, fixedShipmentId });

  const formSurfaceClass =
    showChrome === false
      ? "flex flex-col gap-4"
      : "flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

  const showShipmentPicker = !lockedShipmentId && shipmentMode === "existing";

  return (
    <form onSubmit={submit} className={`${formSurfaceClass} ${formClassName ?? ""}`.trim()}>
      {showChrome ? (
        <>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {premiumMode ? "Enable carrier sync" : "Carrier tracking (premium)"}
          </h2>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {premiumMode
              ? "Enter a published container number to pull live milestones into this shipment. Documentation and portal workflows stay primary."
              : "Optional live carrier sync for shipments that already completed document approval. Prefer creating the commercial shipment first, then enabling sync from the workspace."}
          </p>
        </>
      ) : premiumMode ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Enter a container number when the carrier has published one.
        </p>
      ) : null}

      {onOpenBolImport && !premiumMode ? (
        <details className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
            Advanced: bulk import from bill of lading
          </summary>
          <p className="mt-1.5 pl-0.5">
            <button
              type="button"
              onClick={onOpenBolImport}
              className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-700 dark:text-zinc-200"
            >
              Import multiple containers from a BOL
            </button>
            <span> when the carrier lists many units on one document.</span>
          </p>
        </details>
      ) : onOpenBolImport && premiumMode ? (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={onOpenBolImport}
            className="font-medium text-zinc-700 underline dark:text-zinc-300"
          >
            Bulk import from BOL
          </button>
          <span> for multiple container numbers at once.</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-track-number" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Container number <span className="text-red-600 dark:text-red-400">*</span>
        </label>
        <input
          id="new-track-number"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="e.g. MSCU1234567"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          required
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-track-shipping-line" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Carrier line <span className="font-normal text-zinc-500">(when required by lookup)</span>
        </label>
        <input
          id="new-track-shipping-line"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="e.g. MSC, MAERSK, HAPAG_LLOYD"
          value={shippingLine}
          onChange={(e) => setShippingLine(e.target.value)}
          autoComplete="off"
        />
        {!premiumMode ? (
          <details className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
              Carrier API reference
            </summary>
            <p className="mt-1.5 pl-0.5">
              Some integrations require a carrier line when the container prefix is ambiguous. See{" "}
              <a
                href={JSONCARGO_CONTAINER_DOCS}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-zinc-800 underline dark:text-zinc-200"
              >
                carrier API docs
              </a>
              .
            </p>
          </details>
        ) : null}
      </div>

      {!lockedShipmentId ? (
        <fieldset className="flex flex-col gap-3 border-0 p-0">
          <legend id="shipment-mode-legend" className="mb-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Attach to shipment
          </legend>
          <RadioGroup
            aria-labelledby="shipment-mode-legend"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            <RadioTile
              name="shipment-mode"
              value="existing"
              checked={shipmentMode === "existing"}
              onChange={() => setShipmentMode("existing")}
              title="Existing shipment"
              description="Recommended — attach carrier sync to a commercial shipment you already manage."
            />
            <RadioTile
              name="shipment-mode"
              value="new"
              checked={shipmentMode === "new"}
              onChange={() => setShipmentMode("new")}
              title="Quick sync only"
              description='Creates a minimal shipment row from the container number. Prefer New Shipment for documentation workflows.'
            />
          </RadioGroup>

          {showShipmentPicker ? (
            <div className="mt-1 flex flex-col gap-1.5">
              <span id="existing-shipment-label" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Choose shipment
              </span>
              {shipmentsLoading ? (
                <p className="text-xs text-zinc-500">Loading Shipments…</p>
              ) : shipmentsError ? (
                <p className="text-xs text-red-600 dark:text-red-400">{shipmentsError}</p>
              ) : shipments.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No shipments yet.
                </p>
              ) : (
                <CustomSelect
                  id="existing-shipment-select"
                  aria-labelledby="existing-shipment-label"
                  value={existingShipmentId}
                  onValueChange={setExistingShipmentId}
                  options={shipmentSelectOptions}
                  showAvatars={false}
                  className="w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                />
              )}
            </div>
          ) : shipmentMode === "new" ? (
            <div className="mt-1 flex flex-col gap-1.5">
              <label htmlFor="new-shipment-order" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Order number <span className="font-normal text-zinc-500">(optional)</span>
              </label>
              <input
                id="new-shipment-order"
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder={`Defaults to "${trackingNumber.trim() || "container number"}"`}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
              />
            </div>
          ) : null}
        </fieldset>
      ) : null}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={submitDisabled}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {loading ? "Starting…" : premiumMode ? "Enable carrier sync" : "Start carrier sync"}
      </button>
    </form>
  );
}
