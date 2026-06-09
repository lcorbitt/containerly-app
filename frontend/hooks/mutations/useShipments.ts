import { useMutation } from "@tanstack/react-query";
import { updateShipmentRisk } from "@/services/shipment.service";
import type { UpdateShipmentRiskBody } from "@shared/dto/logistics.dto";

export function useUpdateShipmentRiskMutation() {
  return useMutation({
    mutationFn: (body: UpdateShipmentRiskBody) => updateShipmentRisk(body),
  });
}
