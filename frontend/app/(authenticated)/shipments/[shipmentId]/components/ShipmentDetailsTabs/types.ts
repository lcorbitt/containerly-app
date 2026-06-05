import type { ReactNode } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { ShipmentMetricsSummary } from "@shared/dto/performance.dto";
import type { PublicTimelineEvent } from "@/types/public-report";

export type ShipmentDetailsTabId = "timeline" | "documents" | "messages";

export interface ShipmentDetailsTabsProps {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  physicalMailTrackingNumber?: string | null;
  activityEvents?: ShipmentActivityEvent[];
  carrierEvents?: PublicTimelineEvent[];
  metrics?: ShipmentMetricsSummary;
  detailsContent?: ReactNode;
  activeTab?: ShipmentDetailsTabId;
  onTabChange?: (tab: ShipmentDetailsTabId) => void;
  onActiveTabChange?: (tab: ShipmentDetailsTabId) => void;
  onTrackingEnabled?: () => void;
}
