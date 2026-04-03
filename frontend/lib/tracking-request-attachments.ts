export const TRACKING_REQUEST_FILES_BUCKET = "tracking-request-files";

/** Per-file size limit (25 MB) — typical for team chat / customer portals. */
export const MAX_ATTACHMENT_FILE_BYTES = 25 * 1024 * 1024;

/** Max files attached to a single message (composer). */
export const MAX_ATTACHMENTS_PER_MESSAGE = 8;

/** Human-readable max size for UI copy. */
export const MAX_ATTACHMENT_SIZE_LABEL = "25 MB";

/** Max object path segment length for storage + display safety. */
const MAX_FILENAME_LEN = 180;

/** Max length for editable display name (`tracking_request_attachments.file_name`). */
export const ATTACHMENT_DISPLAY_NAME_MAX_LEN = 500;

/**
 * Whether we should show a raster thumbnail (browser-safe `<img>`).
 * SVG excluded (treat as document). HEIC often won’t render in browsers — icon fallback after onError.
 */
export function isImageThumbnailCandidate(contentType: string | null, fileName: string): boolean {
  const ct = contentType?.toLowerCase().trim() ?? "";
  if (ct.startsWith("image/")) {
    if (ct.includes("svg")) return false;
    return true;
  }
  const ext = fileName.replace(/^.*\./, "").toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif"].includes(ext);
}

/**
 * Storage object names must be S3/Supabase-safe: no spaces, colons, or exotic Unicode
 * (macOS screenshots often use narrow no-break space U+202F before "PM", which breaks keys).
 * Original `File.name` is still stored in `tracking_request_attachments.file_name` for UI.
 */
export function sanitizeAttachmentFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").trim() || "file";
  const normalized = base
    .replace(/[\u202f\u00a0\u2007\u2009\u200b\ufeff]/g, " ")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  const stem = normalized.slice(0, MAX_FILENAME_LEN);
  return stem || "file";
}

/**
 * Storage object path (within bucket): org / tracking_request / {uuid}_{sanitizedName}
 * Matches RLS in migration `20260403120000_tracking_request_attachments.sql`.
 */
export function buildTrackingRequestAttachmentPath(
  organizationId: string,
  trackingRequestId: string,
  file: File,
): { path: string; attachmentId: string } {
  const attachmentId = crypto.randomUUID();
  const safe = sanitizeAttachmentFileName(file.name);
  const path = `${organizationId}/${trackingRequestId}/${attachmentId}_${safe}`;
  return { path, attachmentId };
}
