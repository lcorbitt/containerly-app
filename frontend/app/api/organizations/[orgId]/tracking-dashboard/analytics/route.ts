import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildTrackingDashboardInsightsBundle,
  buildTrackingDashboardReportsBundle,
  resolveOrgDashboardAccess,
} from "@/services/tracking.server";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const scope = new URL(request.url).searchParams.get("scope");

  if (scope !== "insights" && scope !== "reports") {
    return NextResponse.json({ error: "scope must be insights or reports" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await resolveOrgDashboardAccess(supabase, orgId, user.id);

  if (scope === "insights") {
    if (!access.canIncludeOrgInsights) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const bundle = await buildTrackingDashboardInsightsBundle(supabase, orgId);
    return NextResponse.json({ bundle });
  }

  if (!access.canIncludeOrgMetrics) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const bundle = await buildTrackingDashboardReportsBundle(supabase, orgId);
  return NextResponse.json({ bundle });
}
