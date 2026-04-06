import { createClient } from "@/lib/supabase/client";
import {
  fetchImporterGrantedShipmentsPage,
  type ImporterGrantedShipmentSortColumn,
  type SortDirection as ImporterSortDirection,
} from "@/lib/importer-shipments-query";
import {
  fetchOperatorShipmentsOverviewPage,
  type OperatorShipmentScope,
  type OperatorShipmentSortColumn,
  type SortDirection as OperatorSortDirection,
} from "@/lib/operator-shipments-overview-query";
import {
  fetchOperatorTrackingRequestsPage,
  type OperatorRequestScope,
  type OperatorRequestSortColumn,
  type SortDirection as RequestSortDirection,
} from "@/lib/operator-tracking-requests-query";
import { fetchWorkspaceQuickSearch } from "@/lib/workspace-quick-search";

export async function loadImporterGrantedShipmentsPageBrowser(args: {
  page: number;
  pageSize: number;
  sortColumn: ImporterGrantedShipmentSortColumn;
  sortDirection: ImporterSortDirection;
  search: string;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { rows: [], totalCount: 0 };
  return fetchImporterGrantedShipmentsPage(supabase, { userId, ...args });
}

export async function loadOperatorShipmentsOverviewPageBrowser(args: {
  organizationId: string;
  scope: OperatorShipmentScope;
  search: string;
  sortColumn: OperatorShipmentSortColumn;
  sortDirection: OperatorSortDirection;
  page: number;
  pageSize: number;
}) {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  return fetchOperatorShipmentsOverviewPage(supabase, {
    ...args,
    userId: u.user?.id ?? null,
  });
}

export async function loadOperatorTrackingRequestsPageBrowser(args: {
  organizationId: string;
  scope: OperatorRequestScope;
  page: number;
  pageSize: number;
  sortColumn: OperatorRequestSortColumn;
  sortDirection: RequestSortDirection;
  search: string;
}) {
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  return fetchOperatorTrackingRequestsPage(supabase, {
    ...args,
    userId: u.user?.id ?? null,
  });
}

export async function loadWorkspaceQuickSearchBrowser(args: Parameters<typeof fetchWorkspaceQuickSearch>[1]) {
  const supabase = createClient();
  return fetchWorkspaceQuickSearch(supabase, args);
}

export type ShipmentPickRow = {
  id: string;
  reference: string;
  created_at: string;
};

export async function fetchOrganizationShipmentsForTrackingPick(
  organizationId: string,
  limit = 200,
): Promise<ShipmentPickRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("id, reference, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ShipmentPickRow[]) ?? [];
}
