import type { RiskLevel } from "@/utils/report-insights";
import type { ShipmentRiskSelectValue } from "../types";

export interface ShipmentRiskMessageModalProps {
  open: boolean;
  currentRisk: RiskLevel;
  destinationRisk: RiskLevel;
  message: string;
  saving: boolean;
  onDestinationRiskChange: (value: ShipmentRiskSelectValue) => void;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}
