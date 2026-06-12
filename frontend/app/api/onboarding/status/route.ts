import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  fetchPendingTenantInviteForUser,
  fetchUserPrimaryOrganizationId,
  userHasOrganizationMembership,
} from "@/services/tenant-invite.server";

export async function GET() {
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

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured: service role unavailable" },
      { status: 500 },
    );
  }

  try {
    const hasOrgMembership = await userHasOrganizationMembership(admin, user.id);
    const organizationId = hasOrgMembership
      ? await fetchUserPrimaryOrganizationId(admin, user.id)
      : null;
    const pendingTenantInvite = hasOrgMembership
      ? null
      : await fetchPendingTenantInviteForUser(admin, {
          userId: user.id,
          emailLower,
        });

    return NextResponse.json({
      hasOrgMembership,
      organizationId,
      pendingTenantInvite,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not load onboarding status" },
      { status: 500 },
    );
  }
}
