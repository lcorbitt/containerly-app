"use client";

import { Modal } from "@/components/Modal";
import { ShipmentDocumentUploadZone } from "../index";
import { SHIPMENT_DOCUMENT_UPLOAD_MODAL_TITLE } from "./constants";
import type { ShipmentDocumentUploadModalProps } from "./types";

export function ShipmentDocumentUploadModal({
  open,
  onClose,
  uploading = false,
  ...uploadZoneProps
}: ShipmentDocumentUploadModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={SHIPMENT_DOCUMENT_UPLOAD_MODAL_TITLE} busy={uploading}>
      <ShipmentDocumentUploadZone uploading={uploading} {...uploadZoneProps} />
    </Modal>
  );
}
