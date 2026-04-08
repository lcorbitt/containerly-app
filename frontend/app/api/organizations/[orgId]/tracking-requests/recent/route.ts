import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentTrackingRequestsForOrganizationQuery } from "@/services/tracking.server";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50) || 50));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await fetchRecentTrackingRequestsForOrganizationQuery(supabase, orgId, limit);
  return NextResponse.json({ requests });
}
