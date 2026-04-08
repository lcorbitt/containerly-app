import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/utils/api-client";
import type { Alert } from "@/types/database";

export async function fetchOrgAlertsPage(organizationId: string, limit = 50): Promise<Alert[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const { alerts } = await apiJson<{ alerts: Alert[] }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/alerts?${params}`,
  );
  return alerts ?? [];
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
