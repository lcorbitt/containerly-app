import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTrackingDashboardSnapshot } from "@/services/tracking.server";
import { canManageOrganizationSettings } from "@/utils/org-role";
import { isSuperadminRole } from "@/utils/profile-role";

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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isSuperAdmin = isSuperadminRole(profile?.role);

  let membershipRole: string | null = null;
  if (!isSuperAdmin) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();
    membershipRole = (membership?.role as string | null) ?? null;
  }

  const includeOrgMetrics = canManageOrganizationSettings(isSuperAdmin, membershipRole);
  const snapshot = await buildTrackingDashboardSnapshot(supabase, orgId, user.id, { includeOrgMetrics });
  return NextResponse.json({ snapshot });
}
