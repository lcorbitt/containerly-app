import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchShipmentWorkspaceRow } from "@/services/shipment.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string; shipmentId: string }> },
) {
  const { orgId, shipmentId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await fetchShipmentWorkspaceRow(supabase, {
    shipmentId,
    organizationId: orgId,
  });
  return NextResponse.json(result);
}
