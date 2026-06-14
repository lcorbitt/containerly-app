"use client";

import { Modal } from "@/components/Modal";
import { ShipmentCommercialFormFields } from "@/components/ShipmentCommercialFormFields";
import type { ShipmentCommercialFormSource } from "@/components/ShipmentCommercialFormFields/types";
import {
  EDIT_SHIPMENT_DETAILS_MODAL_DESCRIPTION,
  EDIT_SHIPMENT_DETAILS_MODAL_SAVE_LABEL,
  EDIT_SHIPMENT_DETAILS_MODAL_TITLE,
} from "./constants";
import { useEditShipmentDetailsModal } from "./useEditShipmentDetailsModal";

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
  const { values, setValues, error, saving, submit } = useEditShipmentDetailsModal({
    open,
    onClose,
    organizationId,
    shipmentId,
    source,
    onSaved,
  });

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
        onChange={(update) => setValues((prev) => ({ ...prev, ...update }))}
      />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
    </Modal>
  );
}
