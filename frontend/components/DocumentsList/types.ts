export type DocumentsListStoredFile = {
  id: string;
  name: string;
  /** Used with `currentUserId` to show rename/remove only for the uploader. */
  uploadedByUserId?: string;
  /** Shown under the file name (e.g. uploader). */
  uploadedByLabel?: string;
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
  /** When set, shows upload control in the header. */
  onPickFiles?: (files: FileList | null) => void;
  uploading?: boolean;
  onRemoveFile?: (id: string) => void;
  removingFileId?: string | null;
  /** Signed-in user; with `uploadedByUserId` per file, enables uploader-only rename/remove. */
  currentUserId?: string | null;
  onRenameFile?: (id: string, newName: string) => void | Promise<void>;
  renamingFileId?: string | null;
  /** `embedded`: fill a parent tab/panel (no outer card chrome or max-height cap). */
  variant?: "card" | "embedded";
};
