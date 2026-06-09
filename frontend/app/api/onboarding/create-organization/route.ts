import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { completeTenantOnboardingOrganization } from "@/services/tenant-invite.server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const emailLower = (user.email ?? "").trim().toLowerCase();
  if (!emailLower) {
    return NextResponse.json({ error: "Account email not found" }, { status: 400 });
  }

  let body: { name?: string; slug?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const slugInput =
    typeof body.slug === "string" && body.slug.trim() !== "" ? body.slug.trim() : null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  const result = await completeTenantOnboardingOrganization({
    admin,
    userId: user.id,
    emailLower,
    name,
    slugInput,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ id: result.organizationId, inviteId: result.inviteId });
}
