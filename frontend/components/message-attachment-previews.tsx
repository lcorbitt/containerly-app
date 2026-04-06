"use client";

import { Check, FileText, Loader2, Pencil, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { isImageThumbnailCandidate } from "@/lib/workspace-files";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace-storage.service";
import type { WorkspaceAttachment } from "@/types/database";

const THUMB_BOX_THREAD = "h-14 w-14 shrink-0 overflow-hidden rounded-md border border-zinc-200/90 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80";
const THUMB_BOX_COMPOSER = "h-10 w-10 shrink-0 overflow-hidden rounded border border-zinc-200/90 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80";

function FileIconPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ""}`}>
      <FileText className="h-5 w-5 text-zinc-400" strokeWidth={2} aria-hidden />
    </div>
  );
}

/** Local `File` in the message composer — object URL thumbnail for images. */
export function ComposerPendingAttachmentChip({
  file,
  index,
  disabled,
  onRemove,
}: {
  file: File;
  index: number;
  disabled: boolean;
  onRemove: (index: number) => void;
}) {
  const showImg = isImageThumbnailCandidate(file.type || null, file.name);
  const url = useMemo(() => (showImg ? URL.createObjectURL(file) : null), [file, showImg]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <li className="flex max-w-[min(100%,280px)] items-center gap-2 rounded-md border border-zinc-200/90 bg-white/90 py-1.5 pr-1 pl-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-900/80">
      <div className={THUMB_BOX_COMPOSER}>
        {showImg && url ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: preview URL
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <FileIconPlaceholder className="h-full w-full" />
        )}
      </div>
      <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">{file.name}</span>
      <button
        type="button"
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
        onClick={() => onRemove(index)}
        className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </button>
    </li>
  );
}

/** Saved attachment on a thread message — signed URL thumbnail when image. */
export function StoredMessageAttachmentButton({
  row,
  uploaderLabel,
  currentUserId,
  renamingAttachmentId,
  onOpen,
  onRename,
}: {
  row: WorkspaceAttachment;
  uploaderLabel: string;
  currentUserId: string | null;
  renamingAttachmentId: string | null;
  onOpen: () => void;
  onRename: (newName: string) => Promise<void>;
}) {
  const tryImage = isImageThumbnailCandidate(row.content_type, row.file_name);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(tryImage);
  const isUploader = Boolean(currentUserId && row.uploaded_by === currentUserId);
  const busyRename = renamingAttachmentId === row.id;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.file_name);

  useEffect(() => {
    if (!tryImage) return;
    let cancelled = false;
    const run = async () => {
      try {
        const url = await createWorkspaceStorageSignedUrl(row.storage_path, 3600);
        if (cancelled) return;
        setThumbUrl(url);
      } catch {
        if (cancelled) return;
        setShowImage(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [tryImage, row.storage_path]);

  async function saveRename() {
    try {
      await onRename(draft);
      setEditing(false);
    } catch {
      /* workspace toasts */
    }
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-zinc-200/90 bg-white/80 p-2 dark:border-zinc-600/90 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busyRename}
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none ring-zinc-400/30 focus:ring-2 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="File name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditing(false);
                setDraft(row.file_name);
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void saveRename();
              }
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={busyRename}
              onClick={() => void saveRename()}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-zinc-900 px-2.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {busyRename ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
              Save
            </button>
            <button
              type="button"
              disabled={busyRename}
              onClick={() => {
                setEditing(false);
                setDraft(row.file_name);
              }}
              className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex min-w-0 items-stretch gap-1">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-stretch gap-3 rounded-lg border border-zinc-200/90 bg-white/80 py-2 pr-3 pl-2 text-left text-sm transition-colors hover:bg-white dark:border-zinc-600/90 dark:bg-zinc-900/50 dark:hover:bg-zinc-900"
      >
        <div className={THUMB_BOX_THREAD}>
          {showImage && thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase URL
            <img
              src={thumbUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setShowImage(false)}
            />
          ) : (
            <FileIconPlaceholder className="h-full w-full" />
          )}
        </div>
        <span className="min-w-0 flex-1 py-0.5">
          <span className="block font-medium wrap-break-word text-zinc-800 dark:text-zinc-200">
            {row.file_name}
          </span>
          <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">{uploaderLabel}</span>
        </span>
      </button>
      {isUploader ? (
        <button
          type="button"
          aria-label={`Rename ${row.file_name}`}
          disabled={busyRename}
          onClick={() => {
            setDraft(row.file_name);
            setEditing(true);
          }}
          className="mt-1 shrink-0 self-start rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      ) : null}
    </li>
  );
}
