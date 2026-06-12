import { MESSAGE_EVENT_TYPES } from "@shared/in-app-event-taxonomy.ts";

export interface AlertInboxRow {
  actor_user_id?: string | null;
  alert_type: string;
}

/** Hide self-authored legacy message alert rows from inbox (pre-migration cleanup). */
export function filterInboxAlertsForViewer<T extends AlertInboxRow>(
  alerts: T[],
  viewerUserId: string,
): T[] {
  return alerts.filter((alert) => {
    if (!alert.actor_user_id || alert.actor_user_id !== viewerUserId) {
      return true;
    }
    return !MESSAGE_EVENT_TYPES.has(alert.alert_type);
  });
}
