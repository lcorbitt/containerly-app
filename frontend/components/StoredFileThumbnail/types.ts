export interface StoredFileThumbnailProps {
  name: string;
  contentType?: string | null;
  storagePath?: string | null;
  /** Direct URL when already known (e.g. public assets). */
  href?: string;
  className?: string;
}
