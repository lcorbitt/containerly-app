import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPendingAccessRequestsForOrganization } from "@/services/organization.server";

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
    const rows = await fetchPendingAccessRequestsForOrganization(supabase, orgId);
    return NextResponse.json({ rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Load failed" },
      { status: 400 },
    );
  }
}
