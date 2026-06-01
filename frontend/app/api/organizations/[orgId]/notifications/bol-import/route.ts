import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runBolImportedNotification } from "@/services/notification.server";

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

  let body: {
    shipment_id?: string;
    bill_of_lading?: string;
    container_count?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shipmentId = typeof body.shipment_id === "string" ? body.shipment_id.trim() : "";
  const billOfLading = typeof body.bill_of_lading === "string" ? body.bill_of_lading.trim() : "";
  const containerCount =
    typeof body.container_count === "number" && body.container_count > 0
      ? body.container_count
      : 0;

  if (!shipmentId || !billOfLading || containerCount < 1) {
    return NextResponse.json(
      { error: "shipment_id, bill_of_lading, and container_count are required" },
      { status: 400 },
    );
  }

  try {
    await runBolImportedNotification({
      organizationId: orgId,
      shipmentId,
      actorUserId: user.id,
      billOfLading,
      containerCount,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Notification failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
