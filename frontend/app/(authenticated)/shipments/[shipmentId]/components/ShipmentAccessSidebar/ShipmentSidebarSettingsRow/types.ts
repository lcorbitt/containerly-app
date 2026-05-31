import type { ReactNode } from "react";

export interface ShipmentSidebarSettingsRowContext {
  close: () => void;
}

export interface ShipmentSidebarSettingsRowProps {
  label: string;
  summary: ReactNode;
  children: ReactNode | ((context: ShipmentSidebarSettingsRowContext) => ReactNode);
}
