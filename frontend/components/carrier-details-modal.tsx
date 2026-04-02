"use client";

import { Ship, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useState, type MouseEvent } from "react";
import { CarrierReportedStatusPill } from "@/components/status-pills";
import type { ShipmentDetailRow } from "@/lib/jsoncargo-display";

export type CarrierDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  carrierName: string | null;
  /** Raw carrier-reported status string for the pill. */
  reportedStatus: string;
  lastKnownDisplay: string | null;
  lastSyncedAtDisplay: string | null;
  detailRows: ShipmentDetailRow[];
};

export function CarrierDetailsModal({
  open,
  onClose,
  carrierName,
  reportedStatus,
  lastKnownDisplay,
  lastSyncedAtDisplay,
  detailRows,
}: CarrierDetailsModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onBackdrop = useCallback(
    (e: MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const displayName = carrierName?.trim() || "Carrier";

  const modal = (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(255,255,255,0.06)] sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
          <p className="text-xs font-medium text-zinc-400">Carrier Details</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-500/25 text-zinc-100 ring-2 ring-zinc-400/45 shadow-[0_0_24px_-6px_rgba(161,161,170,0.35)]"
              aria-hidden
            >
              <Ship className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="inline-flex rounded-md border border-zinc-500/50 bg-zinc-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-200">
                Carrier
              </span>
              <h2 id={titleId} className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-zinc-50">
                {displayName}
              </h2>
            </div>
          </div>

          <div className="mt-3 divide-y divide-zinc-800">
            <div className="pb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Carrier-reported status</p>
              <div className="mt-1.5">
                <CarrierReportedStatusPill status={reportedStatus} />
              </div>
            </div>

            <div className="py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Last known location</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {lastKnownDisplay?.trim() ? lastKnownDisplay : "—"}
              </p>
            </div>

            {lastSyncedAtDisplay ? (
              <div className="py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Last synced</p>
                <p className="mt-1 text-sm text-zinc-200">{lastSyncedAtDisplay}</p>
              </div>
            ) : null}

            {detailRows.length > 0 ? (
              <div className="pt-2.5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Carrier shipment fields
                </p>
                <dl className="space-y-3">
                  {detailRows.map((row) => (
                    <div key={row.key}>
                      <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{row.label}</dt>
                      <dd className="mt-0.5 text-sm leading-snug text-zinc-100">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              <div className="py-2.5">
                <p className="text-[11px] leading-snug text-zinc-500">
                  No extra carrier fields from your tracking provider yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
