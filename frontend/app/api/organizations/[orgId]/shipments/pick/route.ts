import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchShipmentPickRows } from "@/services/shipment.server";

export type { ShipmentPickRow } from "@/services/shipment.server";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(500, Math.max(1, Number(searchParams.get("limit") ?? 200) || 200));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await fetchShipmentPickRows(supabase, orgId, limit);
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Query failed" },
      { status: 400 },
    );
  }
}
