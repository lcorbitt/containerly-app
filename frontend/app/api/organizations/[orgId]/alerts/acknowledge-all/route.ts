import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acknowledgeAllOrgAlertsForViewer } from "@/services/alert.server";

export async function PATCH(
  _request: Request,
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

  try {
    const acknowledged = await acknowledgeAllOrgAlertsForViewer(supabase, orgId, user.id);
    return NextResponse.json({ ok: true, acknowledged });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not acknowledge notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
