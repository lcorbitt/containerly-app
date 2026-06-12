export const PROFILE_IMAGES_BUCKET = "profile-images";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function assertProfileImageFile(file: { size: number; type?: string }): void {
  if (file.size > PROFILE_IMAGE_MAX_BYTES) {
    throw new Error(`Image must be at most ${PROFILE_IMAGE_MAX_BYTES / (1024 * 1024)} MB`);
  }
  const t = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(t)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF");
  }
}

export function buildProfileImageObjectPath(userId: string, file: { type?: string }): string {
  const t = (file.type || "").toLowerCase();
  if (!ALLOWED_MIME.has(t)) {
    throw new Error("Use JPEG, PNG, WebP, or GIF");
  }
  const ext = EXT_BY_MIME[t] ?? "jpg";
  return `${userId}/${crypto.randomUUID()}.${ext}`;
}
