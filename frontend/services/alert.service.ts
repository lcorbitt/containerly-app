import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/types/database";

export async function fetchOrgAlertsPage(organizationId: string, limit = 50): Promise<Alert[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as Alert[]) ?? [];
}

export type RealtimeAlertsSubscription = {
  unsubscribe: () => void;
};

/** Subscribe to `alerts` changes for an org; `onEvent` should trigger a refetch (e.g. query invalidation). */
export function subscribeOrgAlerts(
  organizationId: string,
  onEvent: () => void,
): RealtimeAlertsSubscription {
  const supabase = createClient();
  const channel = supabase
    .channel(`alerts-org-${organizationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "alerts",
        filter: `organization_id=eq.${organizationId}`,
      },
      () => {
        onEvent();
      },
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void supabase.removeChannel(channel);
    },
  };
}
