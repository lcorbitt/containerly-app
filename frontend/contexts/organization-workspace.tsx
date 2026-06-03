"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { OrgMembershipRow } from "@/types/organization-workspace";
import { fetchOrganizationMembershipRows } from "@/services/organization.service";

export type { OrgMembershipRow };

type OrganizationWorkspaceValue = {
  orgs: OrgMembershipRow[];
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  refreshOrgs: () => Promise<void>;
  isSuperAdmin: boolean;
};

export const OrganizationWorkspaceContext = createContext<OrganizationWorkspaceValue | null>(null);

const STORAGE_KEY = "containerly:activeOrgId";

export function OrganizationWorkspaceProvider({
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
  const [orgs, setOrgs] = useState<OrgMembershipRow[]>(initialOrgs);

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    () => initialOrgs[0]?.organizations?.id ?? null,
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
  }, [initialOrgs]);

  const refreshOrgs = useCallback(async () => {
    const rows = await fetchOrganizationMembershipRows({ userId, isSuperAdmin });
    setOrgs(rows);
    setSelectedOrgId((prev) => {
      if (prev && rows.some((r) => r.organizations?.id === prev)) return prev;
      return rows[0]?.organizations?.id ?? null;
    });
  }, [userId, isSuperAdmin]);

  useEffect(() => {
    try {
      if (selectedOrgId) localStorage.setItem(STORAGE_KEY, selectedOrgId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [selectedOrgId]);

  const value = useMemo(
    () => ({
      orgs,
      selectedOrgId,
      setSelectedOrgId,
      refreshOrgs,
      isSuperAdmin,
    }),
    [orgs, selectedOrgId, refreshOrgs, isSuperAdmin],
  );

  return (
    <OrganizationWorkspaceContext.Provider value={value}>
      {children}
    </OrganizationWorkspaceContext.Provider>
  );
}

export function useOrganizationWorkspace(): OrganizationWorkspaceValue {
  const ctx = useContext(OrganizationWorkspaceContext);
  if (!ctx) {
    throw new Error("useOrganizationWorkspace must be used within OrganizationWorkspaceProvider");
  }
  return ctx;
}
