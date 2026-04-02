"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@/types/database";

export type OrgMembershipRow = {
  role: string;
  organizations: Organization | null;
};

type OrganizationWorkspaceValue = {
  orgs: OrgMembershipRow[];
  selectedOrgId: string | null;
  setSelectedOrgId: (id: string | null) => void;
  refreshOrgs: () => Promise<void>;
  isSuperAdmin: boolean;
};

const OrganizationWorkspaceContext = createContext<OrganizationWorkspaceValue | null>(null);

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

  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(() => {
    const first = initialOrgs[0]?.organizations?.id ?? null;
    if (typeof window === "undefined") return first;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && initialOrgs.some((r) => r.organizations?.id === saved)) return saved;
    } catch {
      /* ignore */
    }
    return first;
  });

  useEffect(() => {
    setOrgs(initialOrgs);
  }, [initialOrgs]);

  const refreshOrgs = useCallback(async () => {
    const supabase = createClient();
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, slug, created_at, updated_at")
        .order("name");
      if (error) return;
      const rows: OrgMembershipRow[] = (data ?? []).map((o) => ({
        role: "platform",
        organizations: o,
      }));
      setOrgs(rows);
      setSelectedOrgId((prev) => {
        if (prev && rows.some((r) => r.organizations?.id === prev)) return prev;
        return rows[0]?.organizations?.id ?? null;
      });
      return;
    }
    const { data, error } = await supabase
      .from("organization_members")
      .select("role, organizations(id, name, slug, created_at, updated_at)")
      .eq("user_id", userId);
    if (error) return;
    const rows: OrgMembershipRow[] = (data ?? []).map((row) => {
      const o = row.organizations;
      const org = Array.isArray(o) ? o[0] : o;
      return { role: row.role as string, organizations: org ?? null };
    });
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
