import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

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

/** `alerts` — insert on sync when status warrants. */
export async function insertAlert(client: SupabaseClient, row: Record<string, unknown>) {
  return client.from("alerts").insert(row);
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

/** Remove inbox rows tied to deleted thread messages (incl. legacy details.message_id). */
export async function deleteAlertsForReportMessageIds(
  client: SupabaseClient,
  messageIds: string[],
): Promise<void> {
  if (messageIds.length === 0) return;

  const { error: byFk } = await client.from("alerts").delete().in("report_message_id", messageIds);
  if (byFk) throw byFk;

  for (const messageId of messageIds) {
    const { error } = await client.from("alerts").delete().contains("details", {
      message_id: messageId,
    });
    if (error) throw error;
  }
}
