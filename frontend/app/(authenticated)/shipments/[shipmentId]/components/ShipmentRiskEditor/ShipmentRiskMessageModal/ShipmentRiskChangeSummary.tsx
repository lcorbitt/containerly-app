import { CustomSelect } from "@/components/CustomSelect";
import { riskInsightBadgeClass, type RiskLevel } from "@/utils/report-insights";
import {
  SHIPMENT_RISK_EDITOR_MODAL_SELECT_SHELL_CLASS,
  SHIPMENT_RISK_SELECT_OPTIONS,
} from "../constants";
import { shipmentRiskSelectFromValue } from "../utils";
import type { ShipmentRiskSelectValue } from "../types";
import {
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_ARROW_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_CURRENT_LABEL,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_DESTINATION_LABEL,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_GROUP_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_LABEL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_PILL_CLASS,
} from "./constants";

function riskPillLabel(level: RiskLevel): string {
  return level.toUpperCase();
}

function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span className={`${SHIPMENT_RISK_MESSAGE_MODAL_RISK_PILL_CLASS} ${riskInsightBadgeClass(level)}`}>
      {riskPillLabel(level)}
    </span>
  );
}

export function ShipmentRiskChangeSummary({
  currentRisk,
  destinationRisk,
  onDestinationRiskChange,
  disabled = false,
}: {
  currentRisk: RiskLevel;
  destinationRisk: RiskLevel;
  onDestinationRiskChange: (value: ShipmentRiskSelectValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_CLASS} aria-label="Risk level change">
      <div className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_GROUP_CLASS}>
        <span className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_LABEL_CLASS}>
          {SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_CURRENT_LABEL}
        </span>
        <RiskPill level={currentRisk} />
      </div>
      <span className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_ARROW_CLASS} aria-hidden>
        →
      </span>
      <div className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_GROUP_CLASS}>
        <span className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_LABEL_CLASS}>
          {SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_DESTINATION_LABEL}
        </span>
        <div className={SHIPMENT_RISK_EDITOR_MODAL_SELECT_SHELL_CLASS}>
          <CustomSelect
            value={destinationRisk}
            onValueChange={(value) => onDestinationRiskChange(shipmentRiskSelectFromValue(value))}
            options={SHIPMENT_RISK_SELECT_OPTIONS}
            showAvatars={false}
            disabled={disabled}
            aria-label="New risk level"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
