import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { markShipmentThreadReadForUser } from "@/services/workspace-actions.server";

export async function PATCH(
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
    await markShipmentThreadReadForUser(supabase, user.id, orgId, shipmentId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not mark thread as read";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
