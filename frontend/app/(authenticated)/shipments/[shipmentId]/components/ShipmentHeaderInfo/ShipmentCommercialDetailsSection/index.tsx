"use client";

import type { ReactNode } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { ShipmentCommercialHeader } from "@/components/ShipmentCommercialHeader";
import { SHIPMENT_COMMERCIAL_DETAILS_SECTION_CLASS } from "./constants";

export function ShipmentCommercialDetailsSection({
  row,
  workflowStatus,
  editModal,
}: {
  row: ShipmentWorkspaceRow;
  workflowStatus: string | null | undefined;
  editModal: ReactNode;
}) {
  return (
    <section className={SHIPMENT_COMMERCIAL_DETAILS_SECTION_CLASS}>
      {editModal}
      <ShipmentCommercialHeader source={row} workflowStatus={workflowStatus} />
    </section>
  );
}
