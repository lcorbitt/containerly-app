"use client";

import { AlertTriangle } from "lucide-react";
import { CarrierReportedStatusPill, ShipmentWorkflowStatusPill, TrackingWorkflowStatusPill } from "@/components/StatusPills";
import {
  ShipmentDetailsSubCard,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS,
} from "@/components/ShipmentDetailsSubCard";
import {
  SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_CLASS,
  SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_EMPTY_CLASS,
  SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_VALUE_CLASS,
  SHIPMENT_STATUS_ASSESSMENT_GRID_CLASS,
  SHIPMENT_STATUS_ASSESSMENT_INSIGHT_ROW_CLASS,
  SHIPMENT_STATUS_ASSESSMENT_INSIGHTS_CLASS,
  SHIPMENT_STATUS_ASSESSMENT_INSIGHT_ICONS,
} from "./constants";
import type { ShipmentStatusAssessmentPanelProps } from "./types";

function AssessmentGridCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_CLASS}>
      <p className={SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS}>{label}</p>
      <div className={SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_VALUE_CLASS}>{children}</div>
    </div>
  );
}

function AssessmentInsightRow({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className={SHIPMENT_STATUS_ASSESSMENT_INSIGHT_ROW_CLASS}>
      <span className={SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS} aria-hidden>
        <Icon className="h-4 w-4" />
      </span>
      <div className={SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS}>
        <p className={SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS}>{label}</p>
      </div>
    </div>
  );
}

export function ShipmentStatusAssessmentPanel({
  workflowStatus,
  primaryCarrierStatus,
  trackingSyncStatus,
  insightCards,
  riskEditor,
}: ShipmentStatusAssessmentPanelProps) {
  return (
    <ShipmentDetailsSubCard title="Status & Risk Assessment" icon={AlertTriangle}>
      <div className={SHIPMENT_STATUS_ASSESSMENT_GRID_CLASS}>
        <AssessmentGridCell label="Documents Status">
          {workflowStatus?.trim() ? (
            <ShipmentWorkflowStatusPill status={workflowStatus} compact />
          ) : (
            <span className={SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_EMPTY_CLASS}>—</span>
          )}
        </AssessmentGridCell>

        <AssessmentGridCell label="Risk Status">{riskEditor}</AssessmentGridCell>

        <AssessmentGridCell label="Tracking Sync">
          {trackingSyncStatus?.trim() ? (
            <TrackingWorkflowStatusPill status={trackingSyncStatus} />
          ) : (
            <span className={SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_EMPTY_CLASS}>—</span>
          )}
        </AssessmentGridCell>

        <AssessmentGridCell label="Carrier Status">
          {primaryCarrierStatus?.trim() ? (
            <CarrierReportedStatusPill status={primaryCarrierStatus} />
          ) : (
            <span className={SHIPMENT_STATUS_ASSESSMENT_GRID_CELL_EMPTY_CLASS}>—</span>
          )}
        </AssessmentGridCell>
      </div>

      {insightCards.length > 0 ? (
        <div className={SHIPMENT_STATUS_ASSESSMENT_INSIGHTS_CLASS}>
          {insightCards.map((card) => {
            const InsightIcon = SHIPMENT_STATUS_ASSESSMENT_INSIGHT_ICONS[card.tone];
            return <AssessmentInsightRow key={card.id} icon={InsightIcon} label={card.headline} />;
          })}
        </div>
      ) : null}
    </ShipmentDetailsSubCard>
  );
}
