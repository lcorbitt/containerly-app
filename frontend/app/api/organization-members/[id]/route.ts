import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchOrganizationMemberRoleForUser } from "@/server/services/organization.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: membershipId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { role?: string };
  try {
    body = (await request.json()) as { role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await patchOrganizationMemberRoleForUser({
    supabase,
    membershipId,
    role: body.role ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ membership: result.membership });
}
