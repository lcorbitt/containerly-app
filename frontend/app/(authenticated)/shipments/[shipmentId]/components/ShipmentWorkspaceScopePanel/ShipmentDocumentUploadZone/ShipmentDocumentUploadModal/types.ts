import type { ShipmentDocumentUploadZoneProps } from "../types";

export interface ShipmentDocumentUploadModalProps extends ShipmentDocumentUploadZoneProps {
  open: boolean;
  onClose: () => void;
}
