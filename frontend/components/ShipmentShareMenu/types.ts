import type { RefObject } from "react";
import type { ShipmentAccessTabContentState } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentAccessTabContent/hooks/useShipmentAccessTabContent";

export interface ShipmentShareMenuProps {
  shipmentId: string;
  state: ShipmentAccessTabContentState;
  variant?: "hub" | "sidebar";
}

export type ShipmentShareAccessRow = {
  id: string;
  label: string;
  sublabel?: string;
  avatarUrl: string | null;
  role: string;
};

export type ShipmentShareMenuPanelProps = {
  shipmentId: string;
  state: ShipmentAccessTabContentState;
  menuId: string;
  panelRef: RefObject<HTMLDivElement | null>;
  panelPos: { top: number; left: number; width: number };
};
