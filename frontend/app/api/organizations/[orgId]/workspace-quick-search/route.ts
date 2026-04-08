import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchWorkspaceQuickSearchForOrg } from "@/services/workspace.server";

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await context.params;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 8) || 8));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await fetchWorkspaceQuickSearchForOrg(supabase, {
    organizationId: orgId,
    query,
    limit,
  });
  return NextResponse.json({ results });
}
