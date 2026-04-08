import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchOperatorTrackingRequestsPage } from "@/services/tracking.server";
import {
  normalizeOperatorSortColumn,
  type OperatorRequestScope,
  type SortDirection,
} from "@/utils/operator-tracking-requests";

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
  const scope = (searchParams.get("scope") ?? "all") as OperatorRequestScope;
  const sortColumn = normalizeOperatorSortColumn(searchParams.get("sortColumn"));
  const sortDirection = (searchParams.get("sortDirection") === "asc" ? "asc" : "desc") as SortDirection;
  const search = searchParams.get("search") ?? "";

  const result = await fetchOperatorTrackingRequestsPage(supabase, {
    organizationId: orgId,
    userId: user.id,
    scope,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    search,
  });

  return NextResponse.json(result);
}
