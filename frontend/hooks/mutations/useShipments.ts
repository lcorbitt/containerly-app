import { useMutation } from "@tanstack/react-query";
import {
  bulkCreateShipments,
  type BulkImportResult,
} from "@/services/shipment-import.service";
import { createShipment, deleteShipment, updateShipment, updateShipmentRisk } from "@/services/shipment.service";
import type {
  CreateShipmentBody,
  DeleteShipmentBody,
  UpdateShipmentBody,
  UpdateShipmentRiskBody,
} from "@shared/dto/logistics.dto";
import type { ShipmentImportDraft } from "@/utils/shipment-import";

export function useUpdateShipmentRiskMutation() {
  return useMutation({
    mutationFn: (body: UpdateShipmentRiskBody) => updateShipmentRisk(body),
  });
}

export function useCreateShipmentMutation() {
  return useMutation({
    mutationFn: (body: CreateShipmentBody) => createShipment(body),
  });
}

export function useBulkCreateShipmentsMutation() {
  return useMutation({
    mutationFn: (args: {
      organizationId: string;
      drafts: Array<{ rowNumber: number; draft: ShipmentImportDraft }>;
      onProgress?: (completed: number, total: number) => void;
    }): Promise<BulkImportResult> =>
      bulkCreateShipments(args.organizationId, args.drafts, args.onProgress),
  });
}

export function useUpdateShipmentMutation() {
  return useMutation({
    mutationFn: (body: UpdateShipmentBody) => updateShipment(body),
  });
}

export function useDeleteShipmentMutation() {
  return useMutation({
    mutationFn: (body: DeleteShipmentBody) => deleteShipment(body),
  });
}
