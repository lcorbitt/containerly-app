import type { ShipmentRiskLevel } from "@shared/dto/logistics.dto";
import type { RiskLevel } from "@/utils/report-insights";

export interface ShipmentRiskEditorProps {
  shipmentId: string;
  organizationId: string;
  riskLevel: string | null;
  riskMessage: string | null;
  primaryCarrierStatus: string | null;
  onSaved: () => void;
}

export type ShipmentRiskSelectValue = "" | ShipmentRiskLevel;

export interface ShipmentRiskEditorFormState {
  riskSelect: ShipmentRiskSelectValue;
  riskMessage: string;
  displayRisk: RiskLevel;
}
