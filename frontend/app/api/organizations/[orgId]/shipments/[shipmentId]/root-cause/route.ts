import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentRootCauseQuery } from "@/services/shipment.server";
import { SHIPMENT_ROOT_CAUSES, type ShipmentRootCause } from "@shared/dto/performance.dto";

function parseRootCause(value: unknown): ShipmentRootCause | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  return SHIPMENT_ROOT_CAUSES.includes(value as ShipmentRootCause)
    ? (value as ShipmentRootCause)
    : null;
}

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

  let body: { root_cause?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rootCause = parseRootCause(body.root_cause);
  if (body.root_cause != null && body.root_cause !== "" && rootCause == null) {
    return NextResponse.json({ error: "Invalid root_cause value" }, { status: 400 });
  }

  try {
    const saved = await updateShipmentRootCauseQuery(supabase, {
      shipmentId,
      organizationId: orgId,
      rootCause,
    });
    return NextResponse.json({ ok: true, root_cause: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
