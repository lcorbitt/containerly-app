import type { ShipmentDetailsTabId } from "./types";

const VALID_TABS = new Set<ShipmentDetailsTabId>(["timeline", "documents", "messages"]);

export function parseShipmentDetailsTabParam(value: string | null | undefined): ShipmentDetailsTabId {
  const tab = value?.trim() ?? "";
  if (tab === "tracking") return "timeline";
  if (VALID_TABS.has(tab as ShipmentDetailsTabId)) {
    return tab as ShipmentDetailsTabId;
  }
  return "timeline";
}
