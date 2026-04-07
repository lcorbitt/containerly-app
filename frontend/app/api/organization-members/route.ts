import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { OrganizationMemberRole } from "@/types/database";
import { inviteOrAddOrganizationMember } from "@/server/services/organization.service";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { organization_id?: string; email?: string; role?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orgId = typeof body.organization_id === "string" ? body.organization_id.trim() : "";
  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role: OrganizationMemberRole = body.role === "admin" ? "admin" : "member";

  if (!orgId) {
    return NextResponse.json({ error: "organization_id is required" }, { status: 400 });
  }
  if (!emailRaw || !emailRaw.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
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

  const result = await inviteOrAddOrganizationMember({
    supabase,
    admin,
    actingUserId: user.id,
    organizationId: orgId,
    emailLower: emailRaw,
    role,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    membership: result.membership,
    invited: result.invited,
  });
}
