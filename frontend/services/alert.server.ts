import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Alert } from "@/types/database";
import { filterInboxAlertsForViewer } from "@/utils/alert-inbox";
import { isInAppNotification } from "@/utils/in-app-event-taxonomy";

export { filterInboxAlertsForViewer };

function isNotificationBellRow(row: Pick<Alert, "alert_type" | "inbox_kind">): boolean {
  return isInAppNotification(row);
}

export async function acknowledgeAllOrgAlertsForViewer(
  supabase: SupabaseClient,
  organizationId: string,
  viewerUserId: string,
): Promise<number> {
  const { data: rows, error: fetchError } = await supabase
    .from("alerts")
    .select("id, recipient_user_id, alert_type")
    .eq("organization_id", organizationId)
    .is("acknowledged_at", null);

  if (fetchError) throw new Error(fetchError.message);

  const ids = (rows ?? [])
    .filter((row) => {
      if (!isNotificationBellRow(row as Pick<Alert, "alert_type" | "inbox_kind">)) return false;
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
    .limit(limit * 3);
  if (error) throw new Error(error.message);
  const rows = ((data as Alert[]) ?? []).filter((alert) => isInAppNotification(alert));
  return filterInboxAlertsForViewer(rows, viewerUserId).slice(0, limit);
}

/** Customer bell: in-app notifications personally addressed to the viewer. */
export async function fetchMyAlertsPage(
  supabase: SupabaseClient,
  viewerUserId: string,
  limit = 50,
): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("recipient_user_id", viewerUserId)
    .order("created_at", { ascending: false })
    .limit(limit * 3);
  if (error) throw new Error(error.message);
  return ((data as Alert[]) ?? [])
    .filter((alert) => isInAppNotification(alert))
    .slice(0, limit);
}

/** Acknowledge every unread notification personally addressed to the viewer. */
export async function acknowledgeAllMyAlerts(
  supabase: SupabaseClient,
  viewerUserId: string,
): Promise<number> {
  const { data: rows, error: fetchError } = await supabase
    .from("alerts")
    .select("id, alert_type")
    .eq("recipient_user_id", viewerUserId)
    .is("acknowledged_at", null);

  if (fetchError) throw new Error(fetchError.message);

  const ids = (rows ?? [])
    .filter((row) => isNotificationBellRow(row as Pick<Alert, "alert_type" | "inbox_kind">))
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
