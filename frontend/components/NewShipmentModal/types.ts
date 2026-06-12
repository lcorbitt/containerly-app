import type { BulkImportResult } from "@/services/shipment-import.service";

export interface NewShipmentModalProps {
  open: boolean;
  onClose: () => void;
  selectedOrgId: string | null;
  creatingShipment: boolean;
  importOpen: boolean;
  onImportOpenChange: (open: boolean) => void;
  onCreated: (shipmentId: string) => void | Promise<void>;
  onSwitchToBulkImport: () => void;
  onCreatingChange: (creating: boolean) => void;
}

export interface NewShipmentBulkImportModalProps {
  open: boolean;
  onClose: () => void;
  selectedOrgId: string | null;
  onBulkComplete: (result: BulkImportResult) => void;
}
