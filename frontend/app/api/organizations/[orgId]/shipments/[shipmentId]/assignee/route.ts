import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentAssigneeQuery } from "@/services/shipment.server";

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

  let body: { assignee_user_id?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assigneeUserId =
    body.assignee_user_id === null || body.assignee_user_id === ""
      ? null
      : typeof body.assignee_user_id === "string"
        ? body.assignee_user_id
        : null;

  try {
    await updateShipmentAssigneeQuery(supabase, {
      shipmentId,
      organizationId: orgId,
      assigneeUserId,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
