import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRole } from "@/types/database";

export type { ProfileRole };

export type SessionProfile = {
  id: string;
  email: string | null;
  role: ProfileRole;
  profile_image_path: string | null;
};

export function isSuperadminRole(role: string | null | undefined): boolean {
  return role === "superadmin";
}

export async function getSessionProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<SessionProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, profile_image_path")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const role = data.role === "superadmin" ? "superadmin" : "user";
  return {
    id: data.id,
    email: data.email ?? null,
    role,
    profile_image_path: data.profile_image_path ?? null,
  };
}
