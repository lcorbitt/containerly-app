import type { RiskLevel } from "@/utils/report-insights";

export interface ShipmentRiskMessageModalProps {
  open: boolean;
  currentRisk: RiskLevel;
  destinationRisk: RiskLevel;
  message: string;
  saving: boolean;
  onMessageChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}
