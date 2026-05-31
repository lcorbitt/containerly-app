import { workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { SHIPMENT_TRACKING_TAB_BUTTON_DISABLED_CLASS } from "./constants";

export function shipmentDetailsTabButtonClass(active: boolean, disabled = false): string {
  const base = `${workspaceTabButtonClass(active)} w-full min-w-0`;
  return disabled ? `${base} ${SHIPMENT_TRACKING_TAB_BUTTON_DISABLED_CLASS}` : base;
}
