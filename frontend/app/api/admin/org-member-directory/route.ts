import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/services/auth-server.service";
import { isSuperadminRole } from "@/utils/profile-role";
import { fetchAdminOrgMemberDirectoryRowsQuery } from "@/services/admin.server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getSessionProfile(supabase, user.id);
  if (!isSuperadminRole(profile?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rows = await fetchAdminOrgMemberDirectoryRowsQuery(supabase);
  return NextResponse.json({ rows });
}
