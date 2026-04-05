"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/types/database";

export function useOrgAlerts(organizationId: string | null) {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!organizationId) {
      setAlerts([]);
      return;
    }

    const supabase = createClient();
    let cancelled = false;

    async function pull() {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled || error) return;
      setAlerts((data as Alert[]) ?? []);
    }

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
          void pull();
        },
      )
      .subscribe();

    void pull();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [organizationId]);

  return alerts;
}
