import type { ShipmentDetailsTabId } from "./types";

const VALID_TABS = new Set<ShipmentDetailsTabId>(["tracking", "documents", "messages"]);

export function parseShipmentDetailsTabParam(value: string | null | undefined): ShipmentDetailsTabId {
  const tab = value?.trim() ?? "";
  if (VALID_TABS.has(tab as ShipmentDetailsTabId)) {
    return tab as ShipmentDetailsTabId;
  }
  return "tracking";
}
