"use client";

import { ShipmentCommercialHeader } from "@/components/ShipmentCommercialHeader";
import type { ShipmentCommercialDetails } from "@shared/dto/logistics.dto";
import type { ReportSummary } from "@shared/dto/shipment.dto";
import {
  PORTAL_COMMERCIAL_DETAILS_SECTION_CLASS,
  PORTAL_PHYSICAL_MAIL_CALLOUT_CLASS,
} from "./constants";
import { commercialDetailsToHeaderSource } from "./utils";

export function PortalCommercialDetailsSection({
  commercialDetails,
  summary,
}: {
  commercialDetails: ShipmentCommercialDetails | null | undefined;
  summary: ReportSummary;
}) {
  if (!commercialDetails) return null;

  const source = commercialDetailsToHeaderSource(commercialDetails, summary);

  return (
    <section aria-label="Shipment commercial details" className={PORTAL_COMMERCIAL_DETAILS_SECTION_CLASS}>
      <ShipmentCommercialHeader
        source={source}
        workflowStatus={commercialDetails.workflow_status}
      />
      {commercialDetails.physical_mail_tracking_number?.trim() ? (
        <p className={PORTAL_PHYSICAL_MAIL_CALLOUT_CLASS}>
          Original documents mailed — tracking: {commercialDetails.physical_mail_tracking_number.trim()}
        </p>
      ) : null}
    </section>
  );
}
