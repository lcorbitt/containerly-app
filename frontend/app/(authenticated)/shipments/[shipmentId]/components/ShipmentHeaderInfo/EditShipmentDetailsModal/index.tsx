"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
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
import {
  EDIT_SHIPMENT_DETAILS_MODAL_DESCRIPTION,
  EDIT_SHIPMENT_DETAILS_MODAL_SAVE_LABEL,
  EDIT_SHIPMENT_DETAILS_MODAL_TITLE,
} from "./constants";

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
  const [values, setValues] = useState(emptyFormValues);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(formValuesFromSource(source));
    setError(null);
    setSaving(false);
  }, [open, source]);

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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={EDIT_SHIPMENT_DETAILS_MODAL_TITLE}
      description={EDIT_SHIPMENT_DETAILS_MODAL_DESCRIPTION}
      size="4xl"
      busy={saving}
      onSubmit={submit}
      bodyClassName="space-y-4"
      footer={
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {saving ? "Saving…" : EDIT_SHIPMENT_DETAILS_MODAL_SAVE_LABEL}
        </button>
      }
    >
      <ShipmentCommercialFormFields
        values={values}
        onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
      />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </Modal>
  );
}
