import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assertProfileImageFile,
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_MAX_BYTES,
} from "@/utils/profile-image";

export const ORG_IMAGES_BUCKET = "org-images";

export { PROFILE_IMAGE_ACCEPT as ORG_IMAGE_ACCEPT, PROFILE_IMAGE_MAX_BYTES as ORG_IMAGE_MAX_BYTES };

export function assertOrgImageFile(file: File): void {
  assertProfileImageFile(file);
}

/** Path within bucket: `{organizationId}/{uuid}.{ext}` */
export function buildOrgImageObjectPath(organizationId: string, file: File): string {
  assertOrgImageFile(file);
  const ALLOWED_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = ALLOWED_MIME[(file.type || "").toLowerCase()] ?? "jpg";
  return `${organizationId}/${crypto.randomUUID()}.${ext}`;
}

export function getOrgImagePublicUrl(
  supabase: SupabaseClient,
  path: string | null | undefined,
): string | null {
  const p = path?.trim();
  if (!p) return null;
  const { data } = supabase.storage.from(ORG_IMAGES_BUCKET).getPublicUrl(p);
  return data.publicUrl ?? null;
}
