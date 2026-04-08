import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTrackingDashboardSnapshot } from "@/services/tracking.server";

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
  const snapshot = await buildTrackingDashboardSnapshot(supabase, orgId, user.id);
  return NextResponse.json({ snapshot });
}
