import { riskInsightBadgeClass, type RiskLevel } from "@/utils/report-insights";
import {
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_ARROW_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_GROUP_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_LABEL_CLASS,
  SHIPMENT_RISK_MESSAGE_MODAL_RISK_PILL_CLASS,
} from "./constants";

function riskPillLabel(level: RiskLevel): string {
  return `${level.toUpperCase()} risk`;
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
}: {
  currentRisk: RiskLevel;
  destinationRisk: RiskLevel;
}) {
  return (
    <div className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_CLASS} aria-label="Risk level change">
      <div className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_GROUP_CLASS}>
        <span className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_LABEL_CLASS}>Current risk</span>
        <RiskPill level={currentRisk} />
      </div>
      <span className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_ARROW_CLASS} aria-hidden>
        →
      </span>
      <div className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_GROUP_CLASS}>
        <span className={SHIPMENT_RISK_MESSAGE_MODAL_RISK_CHANGE_LABEL_CLASS}>Destination risk</span>
        <RiskPill level={destinationRisk} />
      </div>
    </div>
  );
}
