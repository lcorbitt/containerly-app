import type { BulkImportResult } from "@/services/shipment-import.service";
import type { ShipmentImportDraft } from "@/utils/shipment-import";

/** `single` pre-fills the new shipment form; `bulk` creates one shipment per spreadsheet row. */
export type ShipmentImportVariant = "single" | "bulk";

export interface ShipmentDataImportModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  variant: ShipmentImportVariant;
  /** Pre-fill the new shipment form (`variant="single"` only). Called automatically after a successful parse. */
  onApply?: (draft: ShipmentImportDraft, meta: { fileName: string }) => void;
  /** Close single import and open bulk import (`variant="single"` only). */
  onSwitchToBulkImport?: () => void;
  /** Called when the user dismisses the bulk results screen (`variant="bulk"` only), not when the mutation finishes. */
  onBulkDismissed?: (result: BulkImportResult) => void;
}
