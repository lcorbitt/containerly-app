"use client";

import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { useOrgWorkspaceRealtime } from "@/hooks/queries/useOrgWorkspaceRealtime";

/** Subscribes to org alerts + report_messages Realtime for all authenticated routes. */
export function OrgWorkspaceRealtimeBridge() {
  const { selectedOrgId } = useOrganizationWorkspace();
  useOrgWorkspaceRealtime(selectedOrgId);
  return null;
}
