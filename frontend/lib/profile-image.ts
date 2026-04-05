import type { SupabaseClient } from "@supabase/supabase-js";

export const PROFILE_IMAGES_BUCKET = "profile-images";

/** Max upload size (aligned with migration file_size_limit). */
export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function assertProfileImageFile(file: File): void {
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error(`Image must be at most ${PROFILE_IMAGE_MAX_BYTES / (1024 * 1024)} MB`);
  }
  const t = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(t)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF");
  }
}

/** Path within bucket: `{userId}/{uuid}.{ext}` */
export function buildProfileImageObjectPath(userId: string, file: File): string {
  assertProfileImageFile(file);
  const ext = EXT_BY_MIME[(file.type || "").toLowerCase()] ?? "jpg";
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}

export function getProfileImagePublicUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
): string | null {
  const p = path?.trim();
  if (!p) return null;
  const { data } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(p);
  return data.publicUrl ?? null;
}
