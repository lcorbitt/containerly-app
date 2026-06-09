/**
 * Product taxonomy: in-app notifications (bell), operational alerts (triage), message events (threads).
 * Shared by Edge writers and the Next.js frontend via `@shared/in-app-event-taxonomy`.
 */

export type InboxKind = "notification" | "operational_alert";

/** Deprecated in `public.alerts` — unread state lives on shipment message threads. */
export const MESSAGE_EVENT_TYPES = new Set([
  "MESSAGE_NEW",
  "MESSAGE_TEAM",
  "MESSAGE_REPLY",
]);

/** Persisted rows that enrich the /alerts triage queue — not shown in the bell. */
export const OPERATIONAL_ALERT_TYPES = new Set([
  "STATUS_EXCEPTION",
  "SHIPMENT_DELAYED",
  "TRACKING_SYNC_FAILED",
  "DOCUMENT_REJECTED",
  "SLA_RESPONSE_DUE",
]);

/** FYI events for the TopNav notifications bell (+ access requests with inline actions). */
export const NOTIFICATION_TYPES = new Set([
  "ORG_MEMBER_JOINED",
  "ORG_INVITE_ACCEPTED",
  "ASSIGNMENT_ASSIGNEE",
  "ASSIGNMENT_PARTICIPANT",
  "ASSIGNMENT_REASSIGNED",
  "ASSIGNMENT_REMOVED",
  "CUSTOMER_ACCESS_REQUESTED",
  "CUSTOMER_ACCESS_GRANTED",
  "CUSTOMER_INVITE_SENT",
  "CUSTOMER_INVITE_RECEIVED",
  "CUSTOMER_JOINED_ORG",
  "DOCUMENT_UPLOADED",
  "DRAFTS_PUBLISHED",
  "DOCUMENTS_APPROVED",
  "DOCUMENTS_MAILED",
  "TRACKING_LINKED",
  "BOL_IMPORTED",
  "TRACKING_SYNC_OK",
  "INFO",
]);

export function inboxKindForAlertType(alertType: string): InboxKind {
  if (OPERATIONAL_ALERT_TYPES.has(alertType)) return "operational_alert";
  return "notification";
}

export function isMessageEventType(alertType: string): boolean {
  return MESSAGE_EVENT_TYPES.has(alertType);
}

export interface InAppEventRow {
  inbox_kind?: string | null;
  alert_type: string;
}

export function isInAppNotification(row: InAppEventRow): boolean {
  if (MESSAGE_EVENT_TYPES.has(row.alert_type)) return false;
  if (row.inbox_kind === "notification") return true;
  if (row.inbox_kind === "operational_alert") return false;
  return !OPERATIONAL_ALERT_TYPES.has(row.alert_type);
}

export function isOperationalAlert(row: InAppEventRow): boolean {
  if (row.inbox_kind === "operational_alert") return true;
  if (row.inbox_kind === "notification") return false;
  return OPERATIONAL_ALERT_TYPES.has(row.alert_type);
}
