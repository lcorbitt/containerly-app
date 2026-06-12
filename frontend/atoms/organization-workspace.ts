"use client";

import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { fetchOrganizationMembershipRows } from "@/services/organization.service";
import type { OrgMembershipRow } from "@/types/organization-workspace";

export type { OrgMembershipRow };

export const ORG_WORKSPACE_STORAGE_KEY = "containerly:activeOrgId";

export const orgsAtom = atom<OrgMembershipRow[]>([]);

export const selectedOrgIdAtom = atom<string | null>(null);

export const orgWorkspaceMetaAtom = atom<{ userId: string; isSuperAdmin: boolean }>({
  userId: "",
  isSuperAdmin: false,
});

/** True while OrganizationWorkspaceHost is mounted (authenticated freight shell). */
export const orgWorkspaceActiveAtom = atom(false);

export const refreshOrgsAtom = atom(null, async (get, set) => {
  const { userId, isSuperAdmin } = get(orgWorkspaceMetaAtom);
  const rows = await fetchOrganizationMembershipRows({ userId, isSuperAdmin });
  set(orgsAtom, rows);
  set(selectedOrgIdAtom, (prev) => {
    if (prev && rows.some((r) => r.organizations?.id === prev)) return prev;
    return rows[0]?.organizations?.id ?? null;
  });
});

export function useOrganizationWorkspace() {
  const active = useAtomValue(orgWorkspaceActiveAtom);
  const orgs = useAtomValue(orgsAtom);
  const selectedOrgId = useAtomValue(selectedOrgIdAtom);
  const setSelectedOrgId = useSetAtom(selectedOrgIdAtom);
  const meta = useAtomValue(orgWorkspaceMetaAtom);
  const triggerRefresh = useSetAtom(refreshOrgsAtom);
  const refreshOrgs = useCallback(() => triggerRefresh(), [triggerRefresh]);

  if (!active) {
    throw new Error("useOrganizationWorkspace must be used within OrganizationWorkspaceHost");
  }

  return {
    orgs,
    selectedOrgId,
    setSelectedOrgId,
    refreshOrgs,
    isSuperAdmin: meta.isSuperAdmin,
  };
}

/** Returns null outside OrganizationWorkspaceHost (e.g. customer shell). */
export function useOrganizationWorkspaceOptional() {
  const active = useAtomValue(orgWorkspaceActiveAtom);
  const orgs = useAtomValue(orgsAtom);
  const selectedOrgId = useAtomValue(selectedOrgIdAtom);
  const setSelectedOrgId = useSetAtom(selectedOrgIdAtom);
  const meta = useAtomValue(orgWorkspaceMetaAtom);
  const triggerRefresh = useSetAtom(refreshOrgsAtom);
  const refreshOrgs = useCallback(() => triggerRefresh(), [triggerRefresh]);

  if (!active) return null;

  return {
    orgs,
    selectedOrgId,
    setSelectedOrgId,
    refreshOrgs,
    isSuperAdmin: meta.isSuperAdmin,
  };
}
