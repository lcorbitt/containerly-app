/** Signed URL sizing for workspace-files image previews (Supabase Storage transform). */

export const WORKSPACE_STORAGE_PREVIEW_VARIANTS = ["original", "inline", "thumb"] as const;

export type WorkspaceStoragePreviewVariant = (typeof WORKSPACE_STORAGE_PREVIEW_VARIANTS)[number];

export interface WorkspaceStorageImageTransform {
  width: number;
  height: number;
  quality: number;
  resize: "contain";
}

/** ~2× max message preview (max-w-md × max-h-80) for sharp retina inline display. */
export const WORKSPACE_STORAGE_INLINE_IMAGE_TRANSFORM: WorkspaceStorageImageTransform = {
  width: 896,
  height: 640,
  quality: 80,
  resize: "contain",
};

/** Small list / document row thumbnails. */
export const WORKSPACE_STORAGE_THUMB_IMAGE_TRANSFORM: WorkspaceStorageImageTransform = {
  width: 192,
  height: 192,
  quality: 75,
  resize: "contain",
};

export function workspaceStorageImageTransform(
  variant: Extract<WorkspaceStoragePreviewVariant, "inline" | "thumb">,
): WorkspaceStorageImageTransform {
  return variant === "inline"
    ? WORKSPACE_STORAGE_INLINE_IMAGE_TRANSFORM
    : WORKSPACE_STORAGE_THUMB_IMAGE_TRANSFORM;
}

export function usesWorkspaceStorageImageTransform(
  variant: WorkspaceStoragePreviewVariant,
): variant is "inline" | "thumb" {
  return variant === "inline" || variant === "thumb";
}
