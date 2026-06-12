import type { Alert } from "@/types/database";
import { isInAppNotification } from "@/utils/in-app-event-taxonomy";
import { filterInboxAlertsForViewer as filterInboxAlertsForViewerShared } from "@shared/alert-inbox";

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

export function filterInboxAlertsForViewer(alerts: Alert[], viewerUserId: string): Alert[] {
  return filterInboxAlertsForViewerShared(alerts, viewerUserId);
}
