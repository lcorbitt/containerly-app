import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revokeCustomerInviteQuery } from "@/services/shipment.server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await revokeCustomerInviteQuery(supabase, inviteId);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Revoke failed" },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
