import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runParticipantRemovedNotification } from "@/services/notification.server";
import {
  deleteShipmentParticipantQuery,
  fetchShipmentParticipantRowQuery,
} from "@/services/shipment.server";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ participantId: string }> },
) {
  const { participantId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const row = await fetchShipmentParticipantRowQuery(supabase, participantId);
    await deleteShipmentParticipantQuery(supabase, participantId);
    if (row?.shipment_id && row.user_id) {
      const { data: ship } = await supabase
        .from("shipments")
        .select("organization_id")
        .eq("id", row.shipment_id)
        .maybeSingle();
      if (ship?.organization_id) {
        try {
          await runParticipantRemovedNotification({
            organizationId: ship.organization_id as string,
            shipmentId: row.shipment_id as string,
            participantUserId: row.user_id as string,
            actorUserId: user.id,
          });
        } catch {
          /* best-effort */
        }
      }
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Delete failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
