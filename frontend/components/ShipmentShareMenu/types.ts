import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";
import type { ShipmentCustomerAccess } from "@/types/database";

export interface ShipmentShareMenuProps {
  shipmentId: string;
  state: ShipmentAccessTabContentState;
  variant?: "hub" | "sidebar";
}

export type ShipmentShareAccessRowKind = "active" | "pending";

export type ShipmentShareAccessRow = {
  id: string;
  kind: ShipmentShareAccessRowKind;
  label: string;
  sublabel?: string;
  avatarUrl: string | null;
  role: string;
  access?: ShipmentCustomerAccess;
};
