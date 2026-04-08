import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchShipmentAccessTabSnapshot } from "@/services/shipment.server";

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

  const snapshot = await fetchShipmentAccessTabSnapshot(supabase, {
    shipmentId,
    organizationId: orgId,
  });
  return NextResponse.json({ snapshot });
}
