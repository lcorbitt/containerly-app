import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncAlertsForEditedReportMessage } from "@supabase-shared/message-alert-sync.service";
import type { Alert } from "@/types/database";

export { syncAlertsForEditedReportMessage };

/** Message alerts where you are both actor and recipient (should never surface in inbox). */
const SELF_AUTHORED_MESSAGE_ALERT_TYPES = new Set([
  "MESSAGE_NEW",
  "MESSAGE_TEAM",
  "MESSAGE_REPLY",
]);

/** Hide thread notifications you triggered — inbox is for everyone else's activity. */
export function filterInboxAlertsForViewer(alerts: Alert[], viewerUserId: string): Alert[] {
  return alerts.filter((alert) => {
    if (!alert.actor_user_id || alert.actor_user_id !== viewerUserId) {
      return true;
    }
    return !SELF_AUTHORED_MESSAGE_ALERT_TYPES.has(alert.alert_type);
  });
}

export async function fetchOrgAlertsPage(
  supabase: SupabaseClient,
  organizationId: string,
  viewerUserId: string,
  limit = 50,
): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return filterInboxAlertsForViewer((data as Alert[]) ?? [], viewerUserId);
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
