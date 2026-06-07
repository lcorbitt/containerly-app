"use client";

import type { ReactNode } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { ShipmentCommercialDetailsGrid } from "@/components/ShipmentCommercialHeader/ShipmentCommercialDetailsGrid";
import { ShipmentCommercialSummaryBar } from "@/components/ShipmentCommercialHeader/ShipmentCommercialSummaryBar";
import { ShipmentStatusAssessmentPanel } from "@/components/ShipmentStatusAssessmentPanel";
import { ShipmentRiskEditor } from "../../ShipmentRiskEditor";
import {
  SHIPMENT_COMMERCIAL_DETAILS_GRID_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_PANELS_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_SECTION_CLASS,
} from "./constants";

export function ShipmentCommercialDetailsSection({
  row,
  workflowStatus,
  editModal,
  onRiskSaved,
}: {
  row: ShipmentWorkspaceRow;
  workflowStatus: string | null | undefined;
  editModal: ReactNode;
  onRiskSaved: () => void;
}) {
  return (
    <section className={SHIPMENT_COMMERCIAL_DETAILS_SECTION_CLASS}>
      {editModal}
      <ShipmentCommercialSummaryBar source={row} />

      <div className={SHIPMENT_COMMERCIAL_DETAILS_GRID_WRAP_CLASS}>
        <ShipmentCommercialDetailsGrid source={row} />
      </div>

      <div className={SHIPMENT_COMMERCIAL_DETAILS_PANELS_CLASS}>
        <ShipmentStatusAssessmentPanel
          workflowStatus={workflowStatus}
          primaryCarrierStatus={row.primary_carrier_status}
          trackingSyncStatus={row.tracking_requests[0]?.status ?? null}
          insightCards={row.insight_cards}
          riskEditor={
            <ShipmentRiskEditor
              variant="grid-cell"
              shipmentId={row.id}
              organizationId={row.organization_id}
              riskLevel={row.risk_level}
              riskMessage={row.risk_message}
              primaryCarrierStatus={row.primary_carrier_status}
              onSaved={onRiskSaved}
            />
          }
        />
      </div>
    </section>
  );
}
