export const WORKSPACE_FILES_BUCKET = "workspace-files";

/** @deprecated use WORKSPACE_FILES_BUCKET */
export const TRACKING_REQUEST_FILES_BUCKET = WORKSPACE_FILES_BUCKET;

/** Per-file size limit (25 MB) — typical for team chat / customer portals. */
export const MAX_ATTACHMENT_FILE_BYTES = 25 * 1024 * 1024;

/** Max files attached to a single message (composer). */
export const MAX_ATTACHMENTS_PER_MESSAGE = 8;

/** Human-readable max size for UI copy. */
export const MAX_ATTACHMENT_SIZE_LABEL = "25 MB";

/** Max length for editable display name (`workspace_attachments.file_name`). */
export const ATTACHMENT_DISPLAY_NAME_MAX_LEN = 500;

/** Max object path segment length for storage + display safety. */
const MAX_FILENAME_LEN = 180;

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
 * Original `File.name` is still stored in `workspace_attachments.file_name` for UI.
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
 * Storage path (within bucket): org / c / container_id / {uuid}_{sanitizedName}
 */
export function buildContainerAttachmentPath(
  organizationId: string,
  containerId: string,
  file: File,
): { path: string; attachmentId: string } {
  const attachmentId = crypto.randomUUID();
  const safe = sanitizeAttachmentFileName(file.name);
  const path = `${organizationId}/c/${containerId}/${attachmentId}_${safe}`;
  return { path, attachmentId };
}

/**
 * Storage path (within bucket): org / s / shipment_id / {uuid}_{sanitizedName}
 */
export function buildShipmentAttachmentPath(
  organizationId: string,
  shipmentId: string,
  file: File,
): { path: string; attachmentId: string } {
  const attachmentId = crypto.randomUUID();
  const safe = sanitizeAttachmentFileName(file.name);
  const path = `${organizationId}/s/${shipmentId}/${attachmentId}_${safe}`;
  return { path, attachmentId };
}

/** @deprecated use buildContainerAttachmentPath */
export function buildTrackingRequestAttachmentPath(
  organizationId: string,
  containerId: string,
  file: File,
): { path: string; attachmentId: string } {
  return buildContainerAttachmentPath(organizationId, containerId, file);
}
