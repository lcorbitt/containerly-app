export type ShipmentAccessSidebarTabId = "operator" | "customer";

export interface ShipmentAccessSidebarProps {
  shipmentId: string;
  initialAssigneeUserId: string | null;
  onMetaChanged: () => void;
}
