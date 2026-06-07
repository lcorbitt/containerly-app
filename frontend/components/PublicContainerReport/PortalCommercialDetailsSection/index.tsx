"use client";

import type { ShipmentCommercialDetails } from "@shared/dto/logistics.dto";
import type { ReportSummary } from "@shared/dto/shipment.dto";
import { ShipmentCommercialDetailsGrid } from "@/components/ShipmentCommercialHeader/ShipmentCommercialDetailsGrid";
import { ShipmentCommercialSummaryBar } from "@/components/ShipmentCommercialHeader/ShipmentCommercialSummaryBar";
import { ShipmentStatusAssessmentPanel } from "@/components/ShipmentStatusAssessmentPanel";
import { ShipmentRiskEditor } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentRiskEditor";
import { ShipmentRiskStatusDisplay } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentRiskEditor/ShipmentRiskStatusDisplay";
import {
  PORTAL_COMMERCIAL_DETAILS_GRID_WRAP_CLASS,
  PORTAL_COMMERCIAL_DETAILS_PANELS_CLASS,
  PORTAL_COMMERCIAL_DETAILS_SECTION_CLASS,
  PORTAL_PHYSICAL_MAIL_CALLOUT_CLASS,
} from "./constants";
import { commercialDetailsToHeaderSource } from "./utils";

export function PortalCommercialDetailsSection({
  commercialDetails,
  summary,
  shipmentId,
  organizationId,
  viewer,
  riskLevel,
  riskMessage,
  onRiskSaved,
}: {
  commercialDetails: ShipmentCommercialDetails | null | undefined;
  summary: ReportSummary;
  shipmentId: string;
  organizationId: string | null | undefined;
  viewer?: "importer" | "org_member" | string;
  riskLevel: string | null | undefined;
  riskMessage?: string | null;
  onRiskSaved?: () => void;
}) {
  if (!commercialDetails) return null;

  const source = commercialDetailsToHeaderSource(commercialDetails, summary);
  const canEditRisk = viewer === "org_member" && Boolean(organizationId);

  return (
    <section aria-label="Shipment commercial details" className={PORTAL_COMMERCIAL_DETAILS_SECTION_CLASS}>
      <ShipmentCommercialSummaryBar source={source} />

      <div className={PORTAL_COMMERCIAL_DETAILS_GRID_WRAP_CLASS}>
        <ShipmentCommercialDetailsGrid source={source} />
      </div>

      <div className={PORTAL_COMMERCIAL_DETAILS_PANELS_CLASS}>
        <ShipmentStatusAssessmentPanel
          workflowStatus={commercialDetails.workflow_status}
          primaryCarrierStatus={summary.status}
          trackingSyncStatus={summary.tracking_request_status}
          insightCards={[]}
          riskEditor={
            canEditRisk && organizationId ? (
              <ShipmentRiskEditor
                variant="grid-cell"
                shipmentId={shipmentId}
                organizationId={organizationId}
                riskLevel={riskLevel ?? null}
                riskMessage={riskMessage ?? null}
                primaryCarrierStatus={summary.status}
                onSaved={() => onRiskSaved?.()}
              />
            ) : (
              <ShipmentRiskStatusDisplay riskLevel={riskLevel} primaryCarrierStatus={summary.status} />
            )
          }
        />
      </div>

      {commercialDetails.physical_mail_tracking_number?.trim() ? (
        <p className={PORTAL_PHYSICAL_MAIL_CALLOUT_CLASS}>
          Original documents mailed — tracking: {commercialDetails.physical_mail_tracking_number.trim()}
        </p>
      ) : null}
    </section>
  );
}
