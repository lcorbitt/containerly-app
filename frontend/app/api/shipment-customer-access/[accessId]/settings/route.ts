import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateShipmentCustomerAccessSettingsQuery } from "@/services/shipment.server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accessId: string }> },
) {
  const { accessId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    visibility_settings?: Record<string, boolean>;
    operator_overrides?: Record<string, string>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const visibilitySettings = body.visibility_settings ?? {};
  const operatorOverrides = body.operator_overrides ?? {};

  try {
    await updateShipmentCustomerAccessSettingsQuery(supabase, {
      accessId,
      visibilitySettings,
      operatorOverrides,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
