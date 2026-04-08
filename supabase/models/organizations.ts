import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `organizations` — read org display for portal payloads. */
export async function fetchOrganizationForPortal(client: SupabaseClient, organizationId: string) {
  return client.from("organizations").select("id, name, slug").eq("id", organizationId).maybeSingle();
}
