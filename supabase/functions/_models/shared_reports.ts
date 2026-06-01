import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `shared_reports` — public link lookup. */
export async function fetchSharedReportById(client: SupabaseClient, shareId: string) {
  return client
    .from("shared_reports")
    .select("id, organization_id, shipment_id, title, settings, expires_at, revoked_at, created_at")
    .eq("id", shareId)
    .maybeSingle();
}
