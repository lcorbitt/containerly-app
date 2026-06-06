export type DocumentsListStoredFile = {
  id: string;
  name: string;
  /** Used with `currentUserId` to show rename only for the uploader. */
  uploadedByUserId?: string;
  /** Shown under the file name (e.g. uploader). */
  uploadedByLabel?: string;
  /** Operator vs customer upload source. */
  uploadedByKind?: "operator" | "customer" | null;
  /** Shipment document classification (when set on upload). */
  documentType?: string | null;
  documentGroup?: string | null;
  /** For image thumbnails via signed URL (`workspace-files` bucket). */
  contentType?: string | null;
  storagePath?: string | null;
  /** Direct URL when already known (e.g. public assets). */
  href?: string;
  /** Open/download handler (e.g. signed URL). Used when `href` is absent. */
  onOpen?: () => void | Promise<void>;
};

export type DocumentsListProps = {
  billOfLading?: string;
  /** Object-storage files from tracking request attachments. */
  storedFiles?: DocumentsListStoredFile[];
  /** When set, shows upload control in the header (opens native file picker). */
  onPickFiles?: (files: FileList | null) => void;
  /** When set, Upload opens this handler instead of the native file picker. */
  onUploadClick?: () => void;
  uploading?: boolean;
  onRemoveFile?: (id: string) => void;
  removingFileId?: string | null;
  /** When false, any file with `onRemoveFile` can show delete (org operators). Default: uploader only. */
  removeRestrictedToUploader?: boolean;
  /** Signed-in user; with `uploadedByUserId` per file, enables uploader-only rename. */
  currentUserId?: string | null;
  onRenameFile?: (id: string, newName: string) => void | Promise<void>;
  renamingFileId?: string | null;
  /** `embedded`: fill a parent tab/panel (no outer card chrome or max-height cap). */
  variant?: "card" | "embedded";
  /** When true, omits the built-in title/upload header (parent provides chrome). */
  hideHeader?: boolean;
  /** With `embedded`, grow with content instead of filling a fixed-height parent. */
  naturalHeight?: boolean;
};
