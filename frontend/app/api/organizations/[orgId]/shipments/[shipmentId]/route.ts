import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteShipmentForOrganizationQuery } from "@/services/shipment.server";

export async function DELETE(
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

  try {
    await deleteShipmentForOrganizationQuery(supabase, {
      organizationId: orgId,
      shipmentId,
      userId: user.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    const status =
      message === "Shipment not found"
        ? 404
        : message === "Only organization admins can delete shipments"
          ? 403
          : 400;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ shipment_id: shipmentId });
}
