"use client";

import type { ReactNode } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";
import { ShipmentHeaderInfo } from "../index";
import { ShipmentTitleHeading } from "../ShipmentTitleHeading";
import {
  SHIPMENT_COMMERCIAL_DETAILS_GRID_WRAP_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_SECTION_CLASS,
  SHIPMENT_COMMERCIAL_DETAILS_TITLE_CLASS,
} from "./constants";

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

      <div className={SHIPMENT_COMMERCIAL_DETAILS_TITLE_CLASS}>
        <ShipmentTitleHeading row={row} workflowStatus={workflowStatus} />
      </div>

      <div className={SHIPMENT_COMMERCIAL_DETAILS_GRID_WRAP_CLASS}>
        <ShipmentHeaderInfo row={row} />
      </div>
    </section>
  );
}
