import type { ReactNode } from "react";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";

export type ShipmentDetailsTabId = "tracking" | "documents" | "messages";

export interface ShipmentDetailsTabsProps {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  physicalMailTrackingNumber?: string | null;
  activityEvents?: ShipmentActivityEvent[];
  detailsContent?: ReactNode;
  activeTab?: ShipmentDetailsTabId;
  onTabChange?: (tab: ShipmentDetailsTabId) => void;
  onActiveTabChange?: (tab: ShipmentDetailsTabId) => void;
  onTrackingEnabled?: () => void;
}
