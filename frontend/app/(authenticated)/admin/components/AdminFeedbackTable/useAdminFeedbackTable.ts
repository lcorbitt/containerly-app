"use client";

import { useMemo, useState } from "react";
import { useAdminFeedbackQuery } from "@/hooks/queries/useAdminFeedback";
import { useUpdateAdminFeedbackStatusMutation } from "@/hooks/mutations/useUpdateAdminFeedbackStatus";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto";
import type { AdminFeedbackListRow } from "@/services/feedback.service";
import { PAGE_SIZE_OPTIONS } from "./constants";
import { matchesFeedbackSearch } from "./utils";

export function useAdminFeedbackTable() {
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "">("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "">("");
  const [search, setSearchRaw] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeRaw] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);

  const query = useAdminFeedbackQuery({
    category: categoryFilter || undefined,
    status: statusFilter || undefined,
  });

  const statusMutation = useUpdateAdminFeedbackStatusMutation();

  const setSearch = (v: string) => {
    setSearchRaw(v);
    setPage(1);
  };

  const setPageSize = (v: (typeof PAGE_SIZE_OPTIONS)[number]) => {
    setPageSizeRaw(v);
    setPage(1);
  };

  const rows = query.data?.rows ?? [];

  const filtered = useMemo(
    () => rows.filter((row) => matchesFeedbackSearch(row, search)),
    [rows, search],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageRows = useMemo(
    () => filtered.slice(pageStart, pageStart + pageSize),
    [filtered, pageStart, pageSize],
  );

  const summaryLine =
    filtered.length === rows.length
      ? `${rows.length.toLocaleString()} submission${rows.length === 1 ? "" : "s"}`
      : `${filtered.length.toLocaleString()} of ${rows.length.toLocaleString()} submissions`;

  const pageRange =
    filtered.length === 0
      ? "0–0"
      : `${(pageStart + 1).toLocaleString()}–${Math.min(pageStart + pageSize, filtered.length).toLocaleString()}`;

  const pendingId =
    statusMutation.isPending && statusMutation.variables ? statusMutation.variables.id : null;

  const patchError =
    statusMutation.error instanceof Error ? statusMutation.error.message : null;

  async function updateStatus(id: string, status: FeedbackStatus) {
    const updated = await statusMutation.mutateAsync({ id, status });
    return updated.row;
  }

  return {
    query,
    rows,
    filtered,
    pageRows,
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter: (v: FeedbackCategory | "") => {
      setCategoryFilter(v);
      setPage(1);
    },
    statusFilter,
    setStatusFilter: (v: FeedbackStatus | "") => {
      setStatusFilter(v);
      setPage(1);
    },
    page,
    setPage,
    pageSize,
    setPageSize,
    summaryLine,
    pageRange,
    safePage,
    totalPages,
    pendingId,
    patchError,
    updateStatus,
  };
}

export type { AdminFeedbackListRow };
