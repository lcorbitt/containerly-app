import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchOperatorShipmentsOverviewPage,
  normalizeOperatorShipmentSortColumn,
  type OperatorShipmentScope,
  type SortDirection,
} from "@/services/shipment.server";
import { parseOperatorShipmentDateRangeFilter } from "@/utils/operator-shipment-date-filters";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(0, Number(searchParams.get("page") ?? 0) || 0);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? 25) || 25));
  const scope = (searchParams.get("scope") ?? "all") as OperatorShipmentScope;
  const sortColumn = normalizeOperatorShipmentSortColumn(searchParams.get("sortColumn"));
  const sortDirection = (searchParams.get("sortDirection") === "asc" ? "asc" : "desc") as SortDirection;
  const search = searchParams.get("search") ?? "";
  const tagFilter = searchParams.get("tagFilter")?.trim() || null;
  const dateRangeFilter = parseOperatorShipmentDateRangeFilter({
    etaFrom: searchParams.get("etaFrom"),
    etaTo: searchParams.get("etaTo"),
    etdFrom: searchParams.get("etdFrom"),
    etdTo: searchParams.get("etdTo"),
  });

  try {
    const result = await fetchOperatorShipmentsOverviewPage(supabase, {
      organizationId: orgId,
      userId: user.id,
      scope,
      search,
      tagFilter,
      dateRangeFilter,
      sortColumn,
      sortDirection,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load shipments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
