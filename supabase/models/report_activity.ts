import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `report_activity` — audit / timeline entries from Edge flows. */
export async function insertReportActivity(client: SupabaseClient, row: Record<string, unknown>) {
  return client.from("report_activity").insert(row);
}
