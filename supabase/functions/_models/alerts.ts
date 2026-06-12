import type { SupabaseClient } from "@supabase/supabase-js";
import { isInAppNotification } from "@shared/in-app-event-taxonomy.ts";
import { filterInboxAlertsForViewer, type AlertInboxRow } from "@shared/alert-inbox.ts";

function isNotificationBellRow(row: { alert_type: string; inbox_kind?: string | null }): boolean {
  return isInAppNotification(row);
}

/** `alerts` — org bell page for a viewer (in-app notifications only). */
export async function listOrgAlertsPageForViewer(
  client: SupabaseClient,
  organizationId: string,
  viewerUserId: string,
  limit = 50,
) {
  const { data, error } = await client
    .from("alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit * 3);
  if (error) return { data: null, error };
  const rows = ((data as AlertInboxRow[]) ?? []).filter((alert) => isInAppNotification(alert));
  return {
    data: filterInboxAlertsForViewer(rows, viewerUserId).slice(0, limit),
    error: null,
  };
}

/** `alerts` — customer bell: notifications personally addressed to the viewer. */
export async function listMyAlertsPage(
  client: SupabaseClient,
  viewerUserId: string,
  limit = 50,
) {
  const { data, error } = await client
    .from("alerts")
    .select("*")
    .eq("recipient_user_id", viewerUserId)
    .order("created_at", { ascending: false })
    .limit(limit * 3);
  if (error) return { data: null, error };
  const rows = ((data as Record<string, unknown>[]) ?? []).filter((alert) =>
    isInAppNotification(alert as { alert_type: string; inbox_kind?: string | null })
  );
  return { data: rows.slice(0, limit), error: null };
}

/** `alerts` — acknowledge one alert row for the viewer. */
export async function acknowledgeAlertById(
  client: SupabaseClient,
  alertId: string,
  viewerUserId: string,
) {
  return client
    .from("alerts")
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: viewerUserId,
    })
    .eq("id", alertId);
}

/** `alerts` — acknowledge all unread org bell notifications visible to the viewer. */
export async function acknowledgeAllOrgAlertsForViewer(
  client: SupabaseClient,
  organizationId: string,
  viewerUserId: string,
): Promise<{ acknowledged: number; error: string | null }> {
  const { data: rows, error: fetchError } = await client
    .from("alerts")
    .select("id, recipient_user_id, alert_type, inbox_kind")
    .eq("organization_id", organizationId)
    .is("acknowledged_at", null);

  if (fetchError) return { acknowledged: 0, error: fetchError.message };

  const ids = (rows ?? [])
    .filter((row: { id: string; recipient_user_id: string | null; alert_type: string; inbox_kind?: string | null }) => {
      if (!isNotificationBellRow(row)) return false;
      const recipientUserId = row.recipient_user_id;
      return recipientUserId === null || recipientUserId === viewerUserId;
    })
    .map((row: { id: string }) => row.id);

  if (ids.length === 0) return { acknowledged: 0, error: null };

  const nowIso = new Date().toISOString();
  const { error: updateError } = await client
    .from("alerts")
    .update({
      acknowledged_at: nowIso,
      acknowledged_by: viewerUserId,
    })
    .in("id", ids);

  if (updateError) return { acknowledged: 0, error: updateError.message };
  return { acknowledged: ids.length, error: null };
}

/** `alerts` — acknowledge every unread notification personally addressed to the viewer. */
export async function acknowledgeAllMyAlerts(
  client: SupabaseClient,
  viewerUserId: string,
): Promise<{ acknowledged: number; error: string | null }> {
  const { data: rows, error: fetchError } = await client
    .from("alerts")
    .select("id, alert_type, inbox_kind")
    .eq("recipient_user_id", viewerUserId)
    .is("acknowledged_at", null);

  if (fetchError) return { acknowledged: 0, error: fetchError.message };

  const ids = (rows ?? [])
    .filter((row: { id: string; alert_type: string; inbox_kind?: string | null }) =>
      isNotificationBellRow(row)
    )
    .map((row: { id: string }) => row.id);

  if (ids.length === 0) return { acknowledged: 0, error: null };

  const nowIso = new Date().toISOString();
  const { error: updateError } = await client
    .from("alerts")
    .update({
      acknowledged_at: nowIso,
      acknowledged_by: viewerUserId,
    })
    .in("id", ids);

  if (updateError) return { acknowledged: 0, error: updateError.message };
  return { acknowledged: ids.length, error: null };
}

/** `alerts` — portal list for container set. */
export async function listAlertsForContainers(
  client: SupabaseClient,
  containerIds: string[],
  limit = 50,
) {
  if (containerIds.length === 0) {
    return { data: [] as Record<string, unknown>[], error: null };
  }
  return client
    .from("alerts")
    .select("id, alert_type, severity, message, created_at, container_id")
    .in("container_id", containerIds)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** `alerts` — insert with inbox_kind derived from alert_type when omitted. */
export async function insertAlert(client: SupabaseClient, row: Record<string, unknown>) {
  const alertType = typeof row.alert_type === "string" ? row.alert_type : "";
  const inboxKind =
    row.inbox_kind ??
    (alertType === "STATUS_EXCEPTION" ||
    alertType === "SHIPMENT_DELAYED" ||
    alertType === "TRACKING_SYNC_FAILED" ||
    alertType === "DOCUMENT_REJECTED" ||
    alertType === "SLA_RESPONSE_DUE"
      ? "operational_alert"
      : "notification");
  return client.from("alerts").insert({ ...row, inbox_kind: inboxKind });
}

/**
 * Mark the `CUSTOMER_ACCESS_REQUESTED` alert(s) for an access request as resolved: record the
 * decision in `details` and acknowledge it. Keeps the operator's notification in sync with the
 * decision (no stale Approve/Deny buttons), regardless of where the request was resolved.
 */
export async function resolveAccessRequestAlerts(
  client: SupabaseClient,
  accessRequestId: string,
  fields: { decision: "approved" | "denied"; resolvedByUserId: string },
): Promise<void> {
  const { data: rows, error } = await client
    .from("alerts")
    .select("id, details")
    .eq("alert_type", "CUSTOMER_ACCESS_REQUESTED")
    .contains("details", { access_request_id: accessRequestId });
  if (error) throw error;

  const nowIso = new Date().toISOString();
  for (const row of rows ?? []) {
    const current =
      row.details && typeof row.details === "object" && !Array.isArray(row.details)
        ? (row.details as Record<string, unknown>)
        : {};
    const { error: updErr } = await client
      .from("alerts")
      .update({
        acknowledged_at: nowIso,
        details: {
          ...current,
          access_request_status: fields.decision,
          resolved_by_user_id: fields.resolvedByUserId,
        },
      })
      .eq("id", row.id);
    if (updErr) throw updErr;
  }
}
