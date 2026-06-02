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
