"use client";

import { useOrgAlertsQuery } from "@/hooks/queries/use-org-alerts-query";

export function useOrgAlerts(organizationId: string | null) {
  const q = useOrgAlertsQuery(organizationId);
  return q.data ?? [];
}
