import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertShipmentParticipantQuery } from "@/services/shipment.server";

export async function POST(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { shipment_id?: string; user_id?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shipmentId = typeof body.shipment_id === "string" ? body.shipment_id.trim() : "";
  const targetUserId = typeof body.user_id === "string" ? body.user_id.trim() : "";
  if (!shipmentId || !targetUserId) {
    return NextResponse.json({ error: "shipment_id and user_id required" }, { status: 400 });
  }

  try {
    await insertShipmentParticipantQuery(supabase, { shipmentId, userId: targetUserId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Insert failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
