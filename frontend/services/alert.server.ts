import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Alert } from "@/types/database";

export async function fetchOrgAlertsPage(
  supabase: SupabaseClient,
  organizationId: string,
  limit = 50,
): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as Alert[]) ?? [];
}
