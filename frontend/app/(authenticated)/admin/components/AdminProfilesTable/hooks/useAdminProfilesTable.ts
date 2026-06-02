"use client";

import { useEffect, useMemo, useState } from "react";
import { useUpdateProfilePlatformRoleMutation } from "@/hooks/mutations/useProfile";
import type { Profile } from "@/types/database";
import {
  matchesAdminProfileSearch,
  sortAdminProfileRows,
  type AdminProfileRow,
} from "../utils";
import { PAGE_SIZE_OPTIONS } from "../constants";

export function useAdminProfilesTable(initialProfiles: AdminProfileRow[], currentUserId: string) {
  const [profiles, setProfiles] = useState<AdminProfileRow[]>(initialProfiles);
  const roleMutation = useUpdateProfilePlatformRoleMutation();

  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);

  const setSearch = (v: string) => {
    setSearchRaw(v);
    setPage(1);
  };
  const setPageSize = (v: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSizeRaw(v);
    setPage(1);
  };

  useEffect(() => {
    setProfiles(initialProfiles);
  }, [initialProfiles]);

  const pendingId =
    roleMutation.isPending && roleMutation.variables ? roleMutation.variables.profileId : null;

  const patchError =
    roleMutation.error instanceof Error ? roleMutation.error.message : null;

  const sorted = useMemo(() => sortAdminProfileRows(profiles), [profiles]);

  const filtered = useMemo(() => sorted.filter((row) => matchesAdminProfileSearch(row, search)), [sorted, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize],
  );

  const summaryLine =
    filtered.length === sorted.length
      ? `${sorted.length.toLocaleString()} account${sorted.length === 1 ? "" : "s"}`
      : `${filtered.length.toLocaleString()} of ${sorted.length.toLocaleString()} accounts`;

  const pageRange =
    filtered.length === 0
      ? "0–0"
      : `${(pageStart + 1).toLocaleString()}–${Math.min(pageStart + pageSize, filtered.length).toLocaleString()}`;

  async function updateRole(profileId: string, role: Profile["role"]) {
    const updated = await roleMutation.mutateAsync({ profileId, role });
    setProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, role: updated.role } : p)));
  }

  return {
    profiles,
    currentUserId,
    search,
    setSearch,
    page,
    setPage,
    pageSize,
    setPageSize,
    filtered,
    pageRows,
    summaryLine,
    pageRange,
    safePage,
    totalPages,
    pendingId,
    patchError,
    updateRole,
    sortedLength: sorted.length,
  };
}
