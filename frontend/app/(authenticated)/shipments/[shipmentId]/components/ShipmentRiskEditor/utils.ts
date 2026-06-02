import type { ShipmentRiskLevel } from "@shared/dto/logistics.dto";
import { riskFromStatus, type RiskLevel } from "@/utils/report-insights";
import type { ShipmentRiskEditorFormState, ShipmentRiskSelectValue } from "./types";

export function shipmentRiskSelectFromValue(value: string): ShipmentRiskLevel {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "low";
}

export function computedCarrierRisk(primaryCarrierStatus: string | null | undefined): RiskLevel {
  return riskFromStatus(primaryCarrierStatus);
}

/** Operator override when set; otherwise carrier-derived level (no separate “auto” UI). */
export function shipmentRiskSelectValue(
  riskLevel: string | null | undefined,
  primaryCarrierStatus: string | null | undefined,
): ShipmentRiskLevel {
  if (riskLevel === "low" || riskLevel === "medium" || riskLevel === "high") {
    return riskLevel;
  }
  return computedCarrierRisk(primaryCarrierStatus);
}

export function buildShipmentRiskEditorState(input: {
  riskLevel: string | null;
  riskMessage: string | null;
  primaryCarrierStatus: string | null;
}): ShipmentRiskEditorFormState {
  const riskSelect = shipmentRiskSelectValue(input.riskLevel, input.primaryCarrierStatus);

  return {
    riskSelect,
    riskMessage: input.riskMessage?.trim() ?? "",
    displayRisk: riskSelect,
  };
}
