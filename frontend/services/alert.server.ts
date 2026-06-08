import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { syncAlertsForEditedReportMessage } from "@supabase-shared/message-alert-sync.service";
import type { Alert } from "@/types/database";
import { filterInboxAlertsForViewer, MESSAGE_ALERT_TYPES } from "@/utils/alert-inbox";

export { syncAlertsForEditedReportMessage, filterInboxAlertsForViewer };

export async function acknowledgeAllOrgAlertsForViewer(
  supabase: SupabaseClient,
  organizationId: string,
  viewerUserId: string,
): Promise<number> {
  const { data: rows, error: fetchError } = await supabase
    .from("alerts")
    .select("id, alert_type, actor_user_id, recipient_user_id")
    .eq("organization_id", organizationId)
    .is("acknowledged_at", null);

  if (fetchError) throw new Error(fetchError.message);

  const ids = (rows ?? [])
    .filter((row) => {
      const actorUserId = row.actor_user_id as string | null;
      const alertType = row.alert_type as string;
      if (actorUserId && actorUserId === viewerUserId && MESSAGE_ALERT_TYPES.has(alertType)) {
        return false;
      }
      const recipientUserId = row.recipient_user_id as string | null;
      return recipientUserId === null || recipientUserId === viewerUserId;
    })
    .map((row) => row.id as string);

  if (ids.length === 0) return 0;

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("alerts")
    .update({
      acknowledged_at: nowIso,
      acknowledged_by: viewerUserId,
    })
    .in("id", ids);

  if (updateError) throw new Error(updateError.message);
  return ids.length;
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
