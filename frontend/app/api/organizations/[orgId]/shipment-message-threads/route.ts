import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadOrgShipmentMessageThreadsForUser } from "@/services/workspace-actions.server";

export async function GET(
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
    const result = await loadOrgShipmentMessageThreadsForUser(supabase, user.id, orgId);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Could not load message threads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
