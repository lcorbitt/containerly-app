import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRole } from "@/types/database";
import { isSuperadminRole } from "@/utils/profile-role";

export type { ProfileRole };
export { isSuperadminRole };

export type SessionProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
  account_kind: "operator" | "customer";
  profile_image_path: string | null;
};

export async function getSessionProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<SessionProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_kind, profile_image_path")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;

  const role = data.role === "superadmin" ? "superadmin" : "user";
  const fullName = ((data.full_name as string | null | undefined) ?? null)?.trim() || null;
  const accountKind =
    (data.account_kind as string | null | undefined) === "customer" ? "customer" : "operator";
  return {
    id: data.id,
    email: data.email ?? null,
    full_name: fullName,
    role,
    account_kind: accountKind,
    profile_image_path: data.profile_image_path ?? null,
  };
}
