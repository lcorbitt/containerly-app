import type { CreateShipmentBody } from "@shared/dto/logistics.dto";
import { createShipment } from "@/services/shipment.service";
import {
  draftToCreateShipmentBody,
  type ShipmentImportDraft,
} from "@/utils/shipment-import";

export type BulkImportCreatedRow = {
  rowNumber: number;
  orderNumber: string;
  shipmentId: string;
};

export type BulkImportFailedRow = {
  rowNumber: number;
  orderNumber: string;
  error: string;
};

export type BulkImportResult = {
  created: BulkImportCreatedRow[];
  failed: BulkImportFailedRow[];
};

export async function bulkCreateShipments(
  organizationId: string,
  drafts: Array<{ rowNumber: number; draft: ShipmentImportDraft }>,
  onProgress?: (completed: number, total: number) => void,
): Promise<BulkImportResult> {
  const created: BulkImportCreatedRow[] = [];
  const failed: BulkImportFailedRow[] = [];
  const total = drafts.length;

  for (let i = 0; i < drafts.length; i++) {
    const { rowNumber, draft } = drafts[i]!;
    const body: CreateShipmentBody = draftToCreateShipmentBody(organizationId, draft);
    const r = await createShipment(body);
    if (!r.ok) {
      failed.push({
        rowNumber,
        orderNumber: draft.orderNumber,
        error: r.error,
      });
    } else {
      created.push({
        rowNumber,
        orderNumber: draft.orderNumber,
        shipmentId: r.data.shipment_id,
      });
    }
    onProgress?.(i + 1, total);
  }

  return { created, failed };
}
