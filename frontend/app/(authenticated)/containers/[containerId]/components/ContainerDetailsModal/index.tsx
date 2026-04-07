"use client";

import { Package } from "lucide-react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useState, type MouseEvent, type ReactNode } from "react";
import { CarrierReportedStatusPill } from "@/components/StatusPills";
import type { ShipmentDetailRow } from "@/utils/jsoncargo-display";

export type ContainerDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  carrierName: string | null;
  /** Display container id (e.g. container number). */
  containerNumber: string;
  reportedStatus: string;
  lastKnownDisplay: string | null;
  lastSyncedAtDisplay: string | null;
  detailRows: ShipmentDetailRow[];
};

export function ContainerDetailsModal({
  open,
  onClose,
  carrierName,
  containerNumber,
  reportedStatus,
  lastKnownDisplay,
  lastSyncedAtDisplay,
  detailRows,
}: ContainerDetailsModalProps) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
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

  const displayName = carrierName?.trim() || "Container";

  type FieldItem =
    | { key: string; label: string; value: string | null; render?: undefined }
    | { key: string; label: string; render: () => ReactNode; value?: undefined };

  const detailFieldItems: FieldItem[] = detailRows.map((row) => ({
    key: row.key,
    label: row.label,
    value: row.value,
  }));

  const allFields: FieldItem[] = [
    {
      key: "status",
      label: "Reported status",
      render: () => <CarrierReportedStatusPill status={reportedStatus} />,
    },
    { key: "synced", label: "Last synced", value: lastSyncedAtDisplay },
    { key: "location", label: "Last known location", value: lastKnownDisplay },
    ...detailFieldItems,
  ];

  const labelClass = "text-[9px] font-medium uppercase tracking-wide text-zinc-500";
  const valueClass = "mt-0.5 text-xs leading-snug text-zinc-200";

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
        className="flex max-h-[min(90dvh,720px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(255,255,255,0.06)] sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
          <p className="text-lg font-medium text-white">Container Details</p>
          <DialogCloseButton tone="inverse" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
            <div className="flex min-w-0 flex-1 items-start gap-2.5">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-500/25 text-zinc-100 ring-2 ring-zinc-400/45 shadow-[0_0_20px_-6px_rgba(161,161,170,0.35)]"
                aria-hidden
              >
                <Package className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex rounded border border-zinc-500/50 bg-zinc-500/15 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-300">
                  Carrier
                </span>
                <h2 id={titleId} className="mt-1 text-sm font-semibold leading-snug tracking-tight text-zinc-50">
                  {displayName}
                </h2>
              </div>
            </div>
            <div className="shrink-0 pt-0.5 text-right">
              <p className="text-[9px] font-medium uppercase tracking-wide text-zinc-500">Container</p>
              <p className="mt-0.5 font-mono text-xs font-semibold leading-tight tracking-tight text-zinc-100">
                #{containerNumber.trim() || "—"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {allFields.map((field) => (
              <div key={field.key} className="min-w-0">
                <p className={labelClass}>{field.label}</p>
                {"render" in field && field.render ? (
                  <div className="mt-0.5">{field.render()}</div>
                ) : (
                  <p className={valueClass}>{field.value?.trim() ? field.value : "—"}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
