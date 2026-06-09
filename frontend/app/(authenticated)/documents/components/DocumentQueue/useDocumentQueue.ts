"use client";

import { useEffect, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useDocumentQueueQuery } from "@/hooks/queries/useShipment";
import type { DocumentQueueFilter } from "@/services/shipment.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { TABLE_SEARCH_DEBOUNCE_MS } from "@/utils/table-search-debounce";

export function useDocumentQueue() {
  const { selectedOrgId } = useOrganizationWorkspace();
  const [filter, setFilter] = useState<DocumentQueueFilter>("awaiting_review");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, TABLE_SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setPage(0);
  }, [filter, debouncedSearch, pageSize]);

  const query = useDocumentQueueQuery({
    organizationId: selectedOrgId,
    scope: "all",
    workflowFilter: filter,
    search: debouncedSearch,
    page,
    pageSize,
  });

  return {
    loading: query.isLoading,
    rows: query.data?.rows ?? [],
    totalCount: query.data?.totalCount ?? 0,
    filter,
    setFilter,
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    selectedOrgId,
  };
}
