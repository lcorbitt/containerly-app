"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrgAlertsPage, subscribeOrgAlerts } from "@/services/alert.service";

const DEFAULT_ORG_ALERTS_LIMIT = 50;

export const orgAlertsQueryKeyRoot = ["org-alerts"] as const;

function orgAlertsQueryKey(organizationId: string, limit: number) {
  return [...orgAlertsQueryKeyRoot, organizationId, limit] as const;
}

export function useOrgAlertsQuery(organizationId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: organizationId
      ? orgAlertsQueryKey(organizationId, DEFAULT_ORG_ALERTS_LIMIT)
      : [...orgAlertsQueryKeyRoot, "disabled", null],
    queryFn: () => {
      if (!organizationId) throw new Error("organizationId required");
      return fetchOrgAlertsPage(organizationId, DEFAULT_ORG_ALERTS_LIMIT);
    },
    enabled: Boolean(organizationId),
  });

  useEffect(() => {
    if (!organizationId) return;
    const sub = subscribeOrgAlerts(organizationId, () => {
      void qc.invalidateQueries({ queryKey: [...orgAlertsQueryKeyRoot, organizationId] });
    });
    return () => sub.unsubscribe();
  }, [organizationId, qc]);

  return query;
}

export function useOrgAlerts(organizationId: string | null) {
  const q = useOrgAlertsQuery(organizationId);
  return q.data ?? [];
}
