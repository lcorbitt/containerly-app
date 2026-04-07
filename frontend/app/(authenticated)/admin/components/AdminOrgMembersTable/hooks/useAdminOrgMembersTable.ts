"use client";

import { useMemo, useState } from "react";
import { useAdminOrgMembersQuery } from "@/hooks/queries/useOrganization";
import { usePatchOrganizationMemberRoleMutation } from "@/hooks/mutations/useOrganization";
import type { OrganizationMemberRole } from "@/types/database";
import {
  buildOrgOptionsFromRows,
  matchesAdminOrgMemberSearch,
  sortAdminOrgMemberRows,
} from "../utils";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export const ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "member"];

export function useAdminOrgMembersTable() {
  const { data: rows = [], isLoading: loading, error: queryError, refetch } = useAdminOrgMembersQuery();
  const patchMutation = usePatchOrganizationMemberRoleMutation();

  const [search, setSearchRaw] = useState("");
  const [orgFilter, setOrgFilterRaw] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);

  const setSearch = (v: string) => {
    setSearchRaw(v);
    setPage(1);
  };
  const setOrgFilter = (v: string) => {
    setOrgFilterRaw(v);
    setPage(1);
  };
  const setPageSize = (v: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSizeRaw(v);
    setPage(1);
  };

  const error = queryError instanceof Error ? queryError.message : queryError ? String(queryError) : null;

  const pendingId =
    patchMutation.isPending && patchMutation.variables
      ? patchMutation.variables.membershipId
      : null;

  const sorted = useMemo(() => sortAdminOrgMemberRows(rows), [rows]);

  const orgOptions = useMemo(() => buildOrgOptionsFromRows(rows), [rows]);

  const filtered = useMemo(() => {
    return sorted.filter((row) => {
      if (orgFilter !== "all" && row.organizationId !== orgFilter) return false;
      return matchesAdminOrgMemberSearch(row, search);
    });
  }, [sorted, search, orgFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize],
  );

  const summaryLine =
    filtered.length === sorted.length
      ? `${sorted.length.toLocaleString()} membership${sorted.length === 1 ? "" : "s"}`
      : `${filtered.length.toLocaleString()} of ${sorted.length.toLocaleString()} memberships`;

  const pageRange =
    filtered.length === 0
      ? "0–0"
      : `${(pageStart + 1).toLocaleString()}–${Math.min(pageStart + pageSize, filtered.length).toLocaleString()}`;

  function updateRole(membershipId: string, role: OrganizationMemberRole) {
    patchMutation.mutate({ membershipId, role });
  }

  return {
    rowsLength: rows.length,
    patchMutationError: patchMutation.error,
    loading,
    error,
    refetch,
    search,
    setSearch,
    orgFilter,
    setOrgFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    orgOptions,
    filtered,
    pageRows,
    summaryLine,
    pageRange,
    safePage,
    totalPages,
    pendingId,
    updateRole,
  };
}
