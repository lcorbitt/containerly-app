import type { Alert } from "@/types/database";
import { isInAppNotification } from "@/utils/in-app-event-taxonomy";

/** @deprecated Message events no longer create alert rows — use shipment thread unread state. */
export const MESSAGE_ALERT_TYPES = new Set(["MESSAGE_NEW", "MESSAGE_TEAM", "MESSAGE_REPLY"]);

/** TopNav bell: in-app notifications only (not operational alerts or legacy message rows). */
export function filterBellNotifications(alerts: Alert[]): Alert[] {
  return alerts.filter((alert) => isInAppNotification(alert));
}

/** @deprecated Use `filterBellNotifications`. */
export function filterBellNotificationAlerts(alerts: Alert[]): Alert[] {
  return filterBellNotifications(alerts);
}

/** Hide self-authored legacy message alert rows from inbox (pre-migration cleanup). */
export function filterInboxAlertsForViewer(alerts: Alert[], viewerUserId: string): Alert[] {
  return alerts.filter((alert) => {
    if (!alert.actor_user_id || alert.actor_user_id !== viewerUserId) {
      return true;
    }
    return !MESSAGE_ALERT_TYPES.has(alert.alert_type);
  });
}
