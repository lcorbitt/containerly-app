"use client";

import { riskInsightBadgeClass } from "@/utils/report-insights";
import { SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_EMPTY_CLASS } from "@/components/ShipmentStatusAssessmentPanel/constants";
import { SHIPMENT_RISK_EDITOR_PILL_CLASS } from "./constants";
import { shipmentRiskSelectValue } from "./utils";

export function ShipmentRiskStatusDisplay({
  riskLevel,
  primaryCarrierStatus,
}: {
  riskLevel: string | null | undefined;
  primaryCarrierStatus?: string | null | undefined;
}) {
  const displayRisk = shipmentRiskSelectValue(riskLevel, primaryCarrierStatus);

  return (
    <span
      className={`${SHIPMENT_RISK_EDITOR_PILL_CLASS} ${riskInsightBadgeClass(displayRisk)}`}
      aria-label={`${displayRisk} risk`}
    >
      {displayRisk.toUpperCase()}
    </span>
  );
}
