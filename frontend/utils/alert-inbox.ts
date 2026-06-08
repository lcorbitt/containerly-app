import type { Alert } from "@/types/database";

export const MESSAGE_ALERT_TYPES = new Set(["MESSAGE_NEW", "MESSAGE_TEAM", "MESSAGE_REPLY"]);

export function isMessageShipmentAlert(alert: Alert): boolean {
  return MESSAGE_ALERT_TYPES.has(alert.alert_type) && Boolean(alert.shipment_id);
}

/** Message alerts where you are both actor and recipient (should never surface in inbox). */
const SELF_AUTHORED_MESSAGE_ALERT_TYPES = MESSAGE_ALERT_TYPES;

/** Hide thread notifications you triggered — inbox is for everyone else's activity. */
export function filterInboxAlertsForViewer(alerts: Alert[], viewerUserId: string): Alert[] {
  return alerts.filter((alert) => {
    if (!alert.actor_user_id || alert.actor_user_id !== viewerUserId) {
      return true;
    }
    return !SELF_AUTHORED_MESSAGE_ALERT_TYPES.has(alert.alert_type);
  });
}
