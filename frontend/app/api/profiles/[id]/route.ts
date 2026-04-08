import { NextResponse } from "next/server";
import { getSessionProfile } from "@/services/auth-server.service";
import { isSuperadminRole } from "@/utils/profile-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { updateProfileRoleAsSuperadmin } from "@/services/profile.server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: profileId } = await context.params;

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

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  const result = await updateProfileRoleAsSuperadmin({
    admin,
    profileId,
    role: body.role ?? "",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ profile: result.profile });
}
