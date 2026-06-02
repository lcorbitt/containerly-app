"use client";

import type { ReactNode } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { ShipmentCommercialHeader } from "@/components/ShipmentCommercialHeader";
import { ShipmentRiskEditor } from "../../ShipmentRiskEditor";
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
      <ShipmentRiskEditor
        shipmentId={row.id}
        organizationId={row.organization_id}
        riskLevel={row.risk_level}
        riskMessage={row.risk_message}
        primaryCarrierStatus={row.primary_carrier_status}
        onSaved={onRiskSaved}
      />
    </section>
  );
}
