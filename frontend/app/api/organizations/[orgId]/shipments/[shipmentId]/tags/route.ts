import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentTagsQuery } from "@/services/shipment.server";
import { normalizeShipmentTagList } from "@/utils/shipment-tags";

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

  let body: { tags?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.tags)) {
    return NextResponse.json({ error: "tags must be an array of strings" }, { status: 400 });
  }

  const rawTags = body.tags.filter((t): t is string => typeof t === "string");
  const tags = normalizeShipmentTagList(rawTags);

  try {
    const saved = await updateShipmentTagsQuery(supabase, {
      shipmentId,
      organizationId: orgId,
      tags,
    });
    return NextResponse.json({ ok: true, tags: saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
}
