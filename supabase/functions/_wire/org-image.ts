import {
  assertProfileImageFile,
  PROFILE_IMAGE_ACCEPT,
  PROFILE_IMAGE_MAX_BYTES,
} from "@shared/profile-image.ts";

export const ORG_IMAGES_BUCKET = "org-images";

export { PROFILE_IMAGE_ACCEPT as ORG_IMAGE_ACCEPT, PROFILE_IMAGE_MAX_BYTES as ORG_IMAGE_MAX_BYTES };

export function assertOrgImageFile(file: { size: number; type?: string }): void {
  assertProfileImageFile(file);
}

/** Path within bucket: `{organizationId}/{uuid}.{ext}` */
export function buildOrgImageObjectPath(organizationId: string, file: { type?: string }): string {
  const ALLOWED_MIME: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  const ext = ALLOWED_MIME[(file.type || "").toLowerCase()] ?? "jpg";
  return `${organizationId}/${crypto.randomUUID()}.${ext}`;
}
