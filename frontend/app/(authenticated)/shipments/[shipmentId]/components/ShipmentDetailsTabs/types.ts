import type { ReactNode } from "react";
import type { ShipmentWorkspaceRow } from "@/services/shipment.service";

export type ShipmentDetailsTabId = "details" | "documents" | "messages" | "tracking";

export interface ShipmentDetailsTabsProps {
  shipmentId: string;
  organizationId: string;
  workflowStatus: string | null | undefined;
  physicalMailTrackingNumber?: string | null;
  row: Pick<ShipmentWorkspaceRow, "customer_name" | "order_number">;
  detailsContent: ReactNode;
  onActiveTabChange?: (tab: ShipmentDetailsTabId) => void;
  onTrackingEnabled?: () => void;
}
