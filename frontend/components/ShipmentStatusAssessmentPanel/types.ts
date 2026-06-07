import type { ReactNode } from "react";
import type { ShipmentInsightCard } from "@shared/dto/performance.dto";

export interface ShipmentStatusAssessmentPanelProps {
  workflowStatus: string | null | undefined;
  primaryCarrierStatus: string | null | undefined;
  trackingSyncStatus: string | null | undefined;
  insightCards: ShipmentInsightCard[];
  riskEditor: ReactNode;
}
