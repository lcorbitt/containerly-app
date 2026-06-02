"use client";

import type { ReactNode } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { ShipmentCommercialHeader } from "@/components/ShipmentCommercialHeader";
import { ShipmentStatusStrip } from "@/components/ShipmentStatusStrip";
import { ShipmentInsightCards } from "@/components/ShipmentInsightCards";
import { ShipmentRiskEditor } from "../../ShipmentRiskEditor";
import { ShipmentRootCauseSection } from "../../ShipmentRootCauseSection";
import { ShipmentSuggestedActionsPanel } from "../../ShipmentSuggestedActionsPanel";
import { SHIPMENT_COMMERCIAL_DETAILS_SECTION_CLASS } from "./constants";

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
      <ShipmentCommercialHeader source={row} workflowStatus={workflowStatus} />
      <ShipmentStatusStrip
        workflowStatus={workflowStatus}
        primaryCarrierStatus={row.primary_carrier_status}
        trackingSyncStatus={row.tracking_requests[0]?.status ?? null}
        context={row.context}
      />
      <ShipmentSuggestedActionsPanel row={row} shipmentId={row.id} />
      <ShipmentRiskEditor
        shipmentId={row.id}
        organizationId={row.organization_id}
        riskLevel={row.risk_level}
        riskMessage={row.risk_message}
        primaryCarrierStatus={row.primary_carrier_status}
        onSaved={onRiskSaved}
      />
      <ShipmentRootCauseSection
        shipmentId={row.id}
        organizationId={row.organization_id}
        initialRootCause={row.root_cause}
        onSaved={onRiskSaved}
      />
      {row.insight_cards.length > 0 ? (
        <div className="mt-3">
          <ShipmentInsightCards cards={row.insight_cards} />
        </div>
      ) : null}
    </section>
  );
}
