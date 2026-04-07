"use client";

import { CustomSelect } from "@/components/CustomSelect";
import { useNewTrackingForm } from "./hooks/useNewTrackingForm";
import { JSONCARGO_CONTAINER_DOCS } from "./constants";

export function NewTrackingForm({
  organizationId,
  onCreated,
  onOpenBolImport,
  showChrome = true,
  className: formClassName,
}: {
  organizationId: string;
  onCreated: () => void;
  /** Opens BOL lookup (shipment-level: many containers from one document). */
  onOpenBolImport?: () => void;
  /** When false, omit title + intro (e.g. modal supplies its own header). */
  showChrome?: boolean;
  /** Extra classes on the `<form>` (e.g. strip border when embedded in a dialog). */
  className?: string;
}) {
  const {
    trackingNumber,
    setTrackingNumber,
    shippingLine,
    setShippingLine,
    shipmentMode,
    setShipmentMode,
    shipmentReference,
    setShipmentReference,
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
  } = useNewTrackingForm({ organizationId, onCreated });

  const formSurfaceClass =
    showChrome === false
      ? "flex flex-col gap-4"
      : "flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

  return (
    <form onSubmit={submit} className={`${formSurfaceClass} ${formClassName ?? ""}`.trim()}>
      {showChrome ? (
        <>
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Track a container</h2>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Matches JSONCargo{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-[11px] dark:bg-zinc-800">
              GET /api/v1/containers/{"{tracking_number}"}
            </code>
            . Use{" "}
            {onOpenBolImport ? (
              <button
                type="button"
                onClick={onOpenBolImport}
                className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-700 dark:text-zinc-200 dark:decoration-zinc-500 dark:hover:decoration-zinc-300"
              >
                BOL import
              </button>
            ) : (
              <span className="font-medium text-zinc-700 dark:text-zinc-300">BOL import</span>
            )}{" "}
            when the carrier lists many units on one document.
          </p>
        </>
      ) : onOpenBolImport ? (
        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={onOpenBolImport}
            className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 hover:decoration-zinc-700 dark:text-zinc-200 dark:decoration-zinc-500 dark:hover:decoration-zinc-300"
          >
            Import from bill of lading
          </button>
          <span> when the carrier lists many units on one document.</span>
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-track-number" className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Tracking number <span className="text-red-600 dark:text-red-400">*</span>
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
          Shipping line <span className="font-normal text-zinc-500">(when needed)</span>
        </label>
        <input
          id="new-track-shipping-line"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="JSONCargo enum: MAERSK, MSC, HAPAG_LLOYD, …"
          value={shippingLine}
          onChange={(e) => setShippingLine(e.target.value)}
          autoComplete="off"
        />
        <details className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-400">
            When is this required?
          </summary>
          <p className="mt-1.5 pl-0.5">
            JSONCargo treats <code className="font-mono">shipping_line</code> as a query parameter:{" "}
            <strong className="font-medium text-zinc-700 dark:text-zinc-300">required if the prefix is ambiguous</strong>{" "}
            (shared / third-party prefix). If lookup fails without it, add the carrier line your ops team uses for API
            calls, then retry. See{" "}
            <a
              href={JSONCARGO_CONTAINER_DOCS}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-zinc-800 underline dark:text-zinc-200"
            >
              JSONCargo container API
            </a>
            .
          </p>
        </details>
      </div>

      <fieldset className="flex flex-col gap-3 border-0 p-0">
        <legend id="shipment-mode-legend" className="mb-0.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Shipment
        </legend>
        <div
          role="radiogroup"
          aria-labelledby="shipment-mode-legend"
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <button
            type="button"
            role="radio"
            aria-checked={shipmentMode === "new"}
            onClick={() => setShipmentMode("new")}
            className={`group flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950 ${
              shipmentMode === "new"
                ? "border-zinc-900 bg-zinc-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-100 dark:bg-zinc-900/60 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/90 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/40"
            }`}
          >
            <span
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                shipmentMode === "new"
                  ? "border-zinc-900 dark:border-zinc-100"
                  : "border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
              }`}
              aria-hidden
            >
              {shipmentMode === "new" ? (
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                New shipment
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Start a fresh move; title defaults to the tracking number if you leave it blank.
              </span>
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={shipmentMode === "existing"}
            onClick={() => setShipmentMode("existing")}
            className={`group flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-[border-color,box-shadow,background-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-500/50 dark:focus-visible:ring-offset-zinc-950 ${
              shipmentMode === "existing"
                ? "border-zinc-900 bg-zinc-50 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-zinc-100 dark:bg-zinc-900/60 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50/90 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/40"
            }`}
          >
            <span
              className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                shipmentMode === "existing"
                  ? "border-zinc-900 dark:border-zinc-100"
                  : "border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
              }`}
              aria-hidden
            >
              {shipmentMode === "existing" ? (
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              ) : null}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                Existing shipment
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Add this container line to a shipment you already have in the org.
              </span>
            </span>
          </button>
        </div>

        {shipmentMode === "new" ? (
          <div className="mt-1 flex flex-col gap-1.5">
            <label htmlFor="new-shipment-ref" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Shipment title <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="new-shipment-ref"
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder={`Defaults to "${trackingNumber.trim() || "tracking number"}"`}
              value={shipmentReference}
              onChange={(e) => setShipmentReference(e.target.value)}
            />
          </div>
        ) : (
          <div className="mt-1 flex flex-col gap-1.5">
            <span id="existing-shipment-label" className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Choose shipment
            </span>
            {shipmentsLoading ? (
              <p className="text-xs text-zinc-500">Loading shipments…</p>
            ) : shipmentsError ? (
              <p className="text-xs text-red-600 dark:text-red-400">{shipmentsError}</p>
            ) : shipments.length === 0 ? (
              <p className="text-xs text-zinc-500">No shipments yet — create a new one first.</p>
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
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              The container record is linked to this move; carrier data still merges into the shared{" "}
              <code className="font-mono">containers</code> row for this number (latest sync wins).
            </p>
          </div>
        )}
      </fieldset>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={submitDisabled}
        className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {loading ? "Starting…" : "Track container"}
      </button>
    </form>
  );
}
