"use client";

import { useOrgAlertsRealtimeInvalidation } from "@/hooks/queries/useOrgAlertsRealtime";
import { useOrgReportMessagesRealtimeInvalidation } from "@/hooks/queries/useOrgReportMessagesRealtime";

/**
 * Org-scoped Supabase Realtime (WebSocket postgres_changes) for workspace chrome:
 * - `alerts` → top-nav notification list
 * - `report_messages` → side-nav message threads (+ open shipment threads)
 *
 * Mount once in authenticated shell; TanStack Query still fetches on mount as fallback.
 */
export function useOrgWorkspaceRealtime(organizationId: string | null): void {
  useOrgAlertsRealtimeInvalidation(organizationId);
  useOrgReportMessagesRealtimeInvalidation(organizationId);
}
