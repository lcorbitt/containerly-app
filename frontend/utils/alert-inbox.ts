import type { Alert } from "@/types/database";

export const MESSAGE_ALERT_TYPES = new Set(["MESSAGE_NEW", "MESSAGE_TEAM", "MESSAGE_REPLY"]);

export function isMessageShipmentAlert(alert: Alert): boolean {
  return MESSAGE_ALERT_TYPES.has(alert.alert_type) && Boolean(alert.shipment_id);
}
