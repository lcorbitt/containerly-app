import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchImporterGrantedShipmentsPage,
  type ImporterGrantedShipmentSortColumn,
  type SortDirection,
} from "@/services/shipment.server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    page?: number;
    pageSize?: number;
    sortColumn?: ImporterGrantedShipmentSortColumn;
    sortDirection?: SortDirection;
    search?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const page = Math.max(0, Number(body.page ?? 0) || 0);
  const pageSize = Math.min(100, Math.max(1, Number(body.pageSize ?? 25) || 25));
  const sortColumn = body.sortColumn ?? "created_at";
  const sortDirection = body.sortDirection === "asc" ? "asc" : "desc";
  const search = typeof body.search === "string" ? body.search : "";

  const result = await fetchImporterGrantedShipmentsPage(supabase, {
    userId: user.id,
    page,
    pageSize,
    sortColumn,
    sortDirection,
    search,
  });

  return NextResponse.json(result);
}
