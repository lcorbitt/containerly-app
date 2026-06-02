import type { ShipmentRiskLevel } from "@shared/dto/logistics.dto";
import { resolveShipmentRiskLevel, riskFromStatus, type RiskLevel } from "@/utils/report-insights";
import type { ShipmentRiskEditorFormState, ShipmentRiskSelectValue } from "./types";

export function shipmentRiskSelectFromValue(value: string): ShipmentRiskSelectValue {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }
  return "";
}

export function shipmentRiskSelectValue(riskLevel: string | null | undefined): ShipmentRiskSelectValue {
  if (riskLevel === "low" || riskLevel === "medium" || riskLevel === "high") {
    return riskLevel;
  }
  return "";
}

export function computedCarrierRisk(primaryCarrierStatus: string | null | undefined): RiskLevel {
  return riskFromStatus(primaryCarrierStatus);
}

export function buildShipmentRiskEditorState(input: {
  riskLevel: string | null;
  riskMessage: string | null;
  primaryCarrierStatus: string | null;
}): ShipmentRiskEditorFormState {
  const riskSelect = shipmentRiskSelectValue(input.riskLevel);
  const computed = computedCarrierRisk(input.primaryCarrierStatus);
  const displayRisk = resolveShipmentRiskLevel(riskSelect || null, computed);

  return {
    riskSelect,
    riskMessage: input.riskMessage?.trim() ?? "",
    displayRisk,
  };
}

export function displayRiskFromSelect(
  riskSelect: ShipmentRiskSelectValue,
  primaryCarrierStatus: string | null,
): RiskLevel {
  const operatorLevel: ShipmentRiskLevel | null =
    riskSelect === "low" || riskSelect === "medium" || riskSelect === "high" ? riskSelect : null;
  return resolveShipmentRiskLevel(operatorLevel, computedCarrierRisk(primaryCarrierStatus));
}
