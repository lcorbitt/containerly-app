import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentNotificationSubscriptionQuery } from "@/services/shipment.server";

export async function PATCH(
  request: Request,
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

  let body: { subscribed?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.subscribed !== "boolean") {
    return NextResponse.json({ error: "subscribed must be a boolean" }, { status: 400 });
  }

  try {
    const subscribed = await updateShipmentNotificationSubscriptionQuery(supabase, {
      shipmentId,
      organizationId: orgId,
      userId: user.id,
      subscribed: body.subscribed,
    });
    return NextResponse.json({ ok: true, subscribed });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
