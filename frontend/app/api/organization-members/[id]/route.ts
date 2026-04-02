import { NextResponse } from "next/server";
import { getSessionProfile, isSuperadminRole } from "@/lib/auth/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationMemberRole } from "@/types/database";

const ALLOWED: OrganizationMemberRole[] = ["admin", "member"];

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

  const sessionProfile = await getSessionProfile(supabase, user.id);
  if (!isSuperadminRole(sessionProfile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { role?: string };
  try {
    body = (await request.json()) as { role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = body.role;
  if (typeof role !== "string" || !ALLOWED.includes(role as OrganizationMemberRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  const { data, error } = await admin
    .from("organization_members")
    .update({ role })
    .eq("id", membershipId)
    .select("id, organization_id, user_id, role, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }

  return NextResponse.json({ membership: data });
}
