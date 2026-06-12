"use client";

import { useAtom, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useEffect } from "react";
import {
  ORG_WORKSPACE_STORAGE_KEY,
  orgWorkspaceActiveAtom,
  orgWorkspaceMetaAtom,
  orgsAtom,
  selectedOrgIdAtom,
} from "@/atoms/organization-workspace";
import type { OrgMembershipRow } from "@/types/organization-workspace";

export function OrganizationWorkspaceHost({
  children,
  initialOrgs,
  isSuperAdmin,
  userId,
}: {
  children: React.ReactNode;
  initialOrgs: OrgMembershipRow[];
  isSuperAdmin: boolean;
  userId: string;
}) {
  const setOrgs = useSetAtom(orgsAtom);
  const setSelectedOrgId = useSetAtom(selectedOrgIdAtom);
  const setActive = useSetAtom(orgWorkspaceActiveAtom);
  const [selectedOrgId] = useAtom(selectedOrgIdAtom);

  useHydrateAtoms([
    [orgsAtom, initialOrgs],
    [orgWorkspaceMetaAtom, { userId, isSuperAdmin }],
    [selectedOrgIdAtom, initialOrgs[0]?.organizations?.id ?? null],
    [orgWorkspaceActiveAtom, true],
  ]);

  useEffect(() => {
    setActive(true);
    return () => setActive(false);
  }, [setActive]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(ORG_WORKSPACE_STORAGE_KEY);
      if (saved && initialOrgs.some((r) => r.organizations?.id === saved)) {
        setSelectedOrgId(saved);
      }
    } catch {
      /* ignore */
    }
    // Apply stored org once after mount so server and client first paint match (hydration-safe).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialOrgs from first paint only
  }, []);

  useEffect(() => {
    setOrgs(initialOrgs);
  }, [initialOrgs, setOrgs]);

  useEffect(() => {
    try {
      if (selectedOrgId) localStorage.setItem(ORG_WORKSPACE_STORAGE_KEY, selectedOrgId);
      else localStorage.removeItem(ORG_WORKSPACE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [selectedOrgId]);

  return <>{children}</>;
}
