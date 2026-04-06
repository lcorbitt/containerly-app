import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/types/database";

type AdminClient = ReturnType<typeof createAdminClient>;

const ALLOWED_ROLES: ProfileRole[] = ["user", "superadmin"];

export async function updateProfileRoleAsSuperadmin(input: {
  admin: AdminClient;
  profileId: string;
  role: string;
}): Promise<
  | { ok: true; profile: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  if (typeof input.role !== "string" || !ALLOWED_ROLES.includes(input.role as ProfileRole)) {
    return { ok: false, error: "Invalid role", status: 400 };
  }

  const role = input.role as ProfileRole;

  const { data, error } = await input.admin
    .from("profiles")
    .update({ role })
    .eq("id", input.profileId)
    .select("id, email, full_name, role, created_at")
    .single();

  if (error) {
    return { ok: false, error: error.message, status: 500 };
  }

  if (!data) {
    return { ok: false, error: "Profile not found", status: 404 };
  }

  return { ok: true, profile: data as Record<string, unknown> };
}
