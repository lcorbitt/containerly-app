import type { ShipmentContextSummary } from "@shared/dto/performance.dto";

export interface ShipmentStatusStripProps {
  workflowStatus: string | null | undefined;
  primaryCarrierStatus: string | null | undefined;
  trackingSyncStatus?: string | null;
  context: ShipmentContextSummary;
}
