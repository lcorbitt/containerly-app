import { NextResponse } from "next/server";
import { getSessionProfile } from "@/services/auth-server.service";
import { isSuperadminRole } from "@/utils/profile-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createOrganizationWithInitialAdmin, resolveUserIdByEmail } from "@/services/organization.server";

export async function POST(request: Request) {
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

  let body: {
    name?: string;
    slug?: string | null;
    initial_admin_user_id?: string;
    initial_admin_email?: string;
  };
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

  let adminUserId =
    typeof body.initial_admin_user_id === "string" && body.initial_admin_user_id.trim() !== ""
      ? body.initial_admin_user_id.trim()
      : user.id;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  const initialAdminEmail =
    typeof body.initial_admin_email === "string" ? body.initial_admin_email.trim().toLowerCase() : "";
  if (initialAdminEmail) {
    if (!initialAdminEmail.includes("@")) {
      return NextResponse.json({ error: "Valid initial admin email is required" }, { status: 400 });
    }
    const resolved = await resolveUserIdByEmail(admin, initialAdminEmail);
    if (resolved.error || !resolved.userId) {
      return NextResponse.json(
        { error: resolved.error ?? "Could not resolve initial admin user" },
        { status: 400 },
      );
    }
    adminUserId = resolved.userId;
  }

  const result = await createOrganizationWithInitialAdmin({
    admin,
    name,
    slugInput,
    adminUserId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ id: result.organizationId });
}
