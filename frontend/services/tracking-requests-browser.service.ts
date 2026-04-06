import { createClient } from "@/lib/supabase/client";
import type { TrackingRequest } from "@/types/database";

export async function fetchRecentTrackingRequestsForOrganization(
  organizationId: string,
  limit = 50,
): Promise<TrackingRequest[]> {
  const supabase = createClient();
  const { data: tr, error } = await supabase
    .from("tracking_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (tr as TrackingRequest[]) ?? [];
}
