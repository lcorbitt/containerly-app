import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadContainerWorkspaceDataForUser } from "@/services/workspace.server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orgId: string; containerId: string }> },
) {
  const { orgId, containerId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await loadContainerWorkspaceDataForUser(supabase, {
    containerId,
    organizationId: orgId,
  });
  return NextResponse.json(result);
}
