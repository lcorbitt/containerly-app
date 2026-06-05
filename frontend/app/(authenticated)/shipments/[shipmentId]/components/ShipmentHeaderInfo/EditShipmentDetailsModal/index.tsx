"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { ShipmentCommercialFormFields } from "@/components/ShipmentCommercialFormFields";
import {
  emptyFormValues,
  formValuesFromSource,
  formValuesToCommercialHeader,
  formValuesToIdentityLine,
  validateFormValues,
} from "@/components/ShipmentCommercialFormFields/utils";
import type { ShipmentCommercialFormSource } from "@/components/ShipmentCommercialFormFields/types";
import { updateCommercialShipment } from "@/services/shipment.service";

export function EditShipmentDetailsModal({
  open,
  onClose,
  organizationId,
  shipmentId,
  source,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  shipmentId: string;
  source: ShipmentCommercialFormSource;
  onSaved?: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [values, setValues] = useState(emptyFormValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setValues(formValuesFromSource(source));
    setError(null);
    setSaving(false);
  }, [open, source]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, saving, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validationError = validateFormValues(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const r = await updateCommercialShipment({
        organization_id: organizationId,
        shipment_id: shipmentId,
        header: formValuesToCommercialHeader(values),
        lines: [formValuesToIdentityLine(values)],
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open || !portalReady || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] dark:bg-black/70"
        onClick={() => {
          if (!saving) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-[101] m-0 w-full max-w-4xl border-0 bg-white shadow-2xl outline-none dark:bg-zinc-950 sm:rounded-2xl sm:border sm:border-zinc-200 dark:sm:border-zinc-700"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Edit shipment details
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Update commercial header fields for this shipment.
            </p>
          </div>
          <DialogCloseButton
            onClick={() => {
              if (!saving) onClose();
            }}
          />
        </div>

        <form onSubmit={submit} className="flex max-h-[75vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <ShipmentCommercialFormFields
              values={values}
              onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
            />
            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          </div>
          <div className="border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
