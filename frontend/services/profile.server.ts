import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRole } from "@/types/database";
import { profileDisplayName } from "@/utils/author-display-name";
import {
  PROFILE_IMAGES_BUCKET,
  buildProfileImageObjectPath,
} from "@/utils/profile-image";

type AdminClient = ReturnType<typeof createAdminClient>;

const ALLOWED_ROLES: ProfileRole[] = ["user", "superadmin"];

export async function fetchMyProfileFieldsQuery(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ profileImagePath: string | null; fullName: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("profile_image_path, full_name")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const path = ((data?.profile_image_path as string | null | undefined) ?? null)?.trim() || null;
  const fullName = ((data?.full_name as string | null | undefined) ?? null)?.trim() || null;
  return { profileImagePath: path, fullName: fullName || null };
}

/** Settings page bootstrap (RSC): profile fields + email. */
export async function fetchSettingsPageProfileQuery(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  email: string | null;
  fullName: string | null;
  profileImagePath: string | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, profile_image_path")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  const profileImagePath =
    typeof data?.profile_image_path === "string" ? data.profile_image_path : null;
  const fullName = ((data?.full_name as string | null | undefined) ?? null)?.trim() || null;
  const email = ((data?.email as string | null | undefined) ?? null)?.trim() || null;
  return {
    email,
    fullName: fullName || null,
    profileImagePath: profileImagePath?.trim() || null,
  };
}

export async function updateProfileFullNameForUser(
  supabase: SupabaseClient,
  userId: string,
  fullName: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function fetchProfileDisplayNameMapForUserIds(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  if (unique.length === 0) return {};
  const { data: profs, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .in("id", unique);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const p of profs ?? []) {
    map[p.id as string] = profileDisplayName({
      full_name: p.full_name as string | null,
      email: p.email as string | null,
    });
  }
  return map;
}

export async function uploadProfileImageAndSetPathServer(
  supabase: SupabaseClient,
  input: { userId: string; file: File; previousPath: string | null },
): Promise<string> {
  const objectPath = buildProfileImageObjectPath(input.userId, input.file);
  const { error: upErr } = await supabase.storage
    .from(PROFILE_IMAGES_BUCKET)
    .upload(objectPath, input.file, {
      contentType: input.file.type || undefined,
      upsert: false,
    });
  if (upErr) throw new Error(upErr.message);

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ profile_image_path: objectPath })
    .eq("id", input.userId);
  if (dbErr) {
    await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([objectPath]);
    throw new Error(dbErr.message);
  }

  if (input.previousPath?.trim()) {
    await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([input.previousPath.trim()]);
  }
  return objectPath;
}

export async function clearProfileImagePathServer(
  supabase: SupabaseClient,
  input: { userId: string; storagePath: string },
): Promise<{ storageRemoved: boolean }> {
  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ profile_image_path: null })
    .eq("id", input.userId);
  if (dbErr) throw new Error(dbErr.message);

  const { error: rmErr } = await supabase.storage.from(PROFILE_IMAGES_BUCKET).remove([input.storagePath]);
  return { storageRemoved: !rmErr };
}

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
