"use client";

import { Check, FileText, Loader2, Pencil, Trash2, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { isImageThumbnailCandidate } from "@/utils/workspace-files";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace.service";
import type { DocumentsListProps } from "./types";

export type { DocumentsListStoredFile, DocumentsListProps } from "./types";

const THUMB_BOX_DOCS =
  "h-12 w-12 shrink-0 overflow-hidden rounded-md border border-zinc-200/90 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80";

function FileIconPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ""}`}>
      <FileText className="h-5 w-5 text-zinc-400" strokeWidth={2} aria-hidden />
    </div>
  );
}

/** Image preview: signed URL from storage, or direct `href` when it points at an image. */
function DocumentsStoredFileThumbnail({
  name,
  contentType,
  storagePath,
  href,
}: {
  name: string;
  contentType?: string | null;
  storagePath?: string | null;
  href?: string;
}) {
  const tryImage = isImageThumbnailCandidate(contentType ?? null, name);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [showImage, setShowImage] = useState(tryImage);

  useEffect(() => {
    setShowImage(tryImage);
  }, [tryImage]);

  useEffect(() => {
    if (!tryImage) {
      setThumbUrl(null);
      return;
    }
    const path = storagePath?.trim();
    const direct = href?.trim();
    if (direct && !path) {
      setThumbUrl(direct);
      return;
    }
    if (!path) {
      setThumbUrl(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const url = await createWorkspaceStorageSignedUrl(path, 3600);
        if (cancelled) return;
        setThumbUrl(url);
      } catch {
        if (cancelled) return;
        setShowImage(false);
        setThumbUrl(null);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [tryImage, storagePath, href]);

  return (
    <div className={THUMB_BOX_DOCS}>
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
  );
}

export function DocumentsList({
  billOfLading,
  storedFiles,
  onPickFiles,
  uploading,
  onRemoveFile,
  removingFileId,
  currentUserId,
  onRenameFile,
  renamingFileId,
  variant = "card",
}: DocumentsListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function submitRename(fileId: string) {
    if (!onRenameFile) return;
    try {
      await Promise.resolve(onRenameFile(fileId, editDraft));
      setEditingFileId(null);
      setEditDraft("");
    } catch {
      /* parent shows toast */
    }
  }

  const bol = billOfLading?.trim() ?? "";
  const hasStored = storedFiles && storedFiles.length > 0;
  const hasAny = Boolean(bol) || hasStored;
  const shell =
    variant === "embedded"
      ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent shadow-none dark:bg-transparent"
      : "flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-[min(320px,calc(100dvh-14rem))]";

  return (
    <div className={shell}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</h2>
        {onPickFiles ? (
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="sr-only"
              aria-label="Upload files"
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <Upload className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
              Upload
            </button>
          </>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {hasAny ? (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {storedFiles?.map((f) => {
              const busyRemove = removingFileId === f.id;
              const busyRename = renamingFileId === f.id;
              const busy = busyRemove || busyRename;
              const isUploader = Boolean(currentUserId && f.uploadedByUserId === currentUserId);
              const showRemove = Boolean(onRemoveFile && isUploader);
              const showRename = Boolean(onRenameFile && isUploader);
              const isEditing = editingFileId === f.id;
              const open = async () => {
                if (f.href) {
                  window.open(f.href, "_blank", "noopener,noreferrer");
                  return;
                }
                await f.onOpen?.();
              };
              return (
                <li key={f.id}>
                  <div className="flex items-start gap-1 rounded-md py-0.5 pr-1 pl-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                    {isEditing ? (
                      <div className="flex min-w-0 flex-1 items-start gap-2 px-1.5 py-2">
                        <DocumentsStoredFileThumbnail
                          name={f.name}
                          contentType={f.contentType}
                          storagePath={f.storagePath}
                          href={f.href}
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <input
                          type="text"
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          disabled={busyRename}
                          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-800 outline-none ring-zinc-400/30 focus:ring-2 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                          aria-label="File name"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              setEditingFileId(null);
                              setEditDraft("");
                            }
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              void submitRename(f.id);
                            }
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyRename}
                            onClick={() => void submitRename(f.id)}
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
                              setEditingFileId(null);
                              setEditDraft("");
                            }}
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2.5 text-xs font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                            Cancel
                          </button>
                        </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void open()}
                        disabled={busy}
                        className="flex min-w-0 flex-1 items-start gap-2 rounded-md px-1.5 py-2 text-left text-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed dark:hover:bg-zinc-900/60"
                      >
                        <DocumentsStoredFileThumbnail
                          name={f.name}
                          contentType={f.contentType}
                          storagePath={f.storagePath}
                          href={f.href}
                        />
                        <span className="min-w-0 pt-0.5">
                          <span className="block font-medium wrap-break-word text-zinc-800 dark:text-zinc-200">
                            {f.name}
                          </span>
                          {f.uploadedByLabel?.trim() ? (
                            <span className="mt-1 block text-xs font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">
                              Uploaded by: {f.uploadedByLabel.trim()}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    )}
                    {!isEditing && showRename ? (
                      <button
                        type="button"
                        aria-label={`Rename ${f.name}`}
                        disabled={busy}
                        onClick={() => {
                          setEditingFileId(f.id);
                          setEditDraft(f.name);
                        }}
                        className="mt-1.5 shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      >
                        <Pencil className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </button>
                    ) : null}
                    {showRemove ? (
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        disabled={busyRemove}
                        onClick={() => onRemoveFile!(f.id)}
                        className="mt-1.5 shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        {busyRemove ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                        )}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
            {bol ? (
              <li className="flex items-start gap-2 px-2 py-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Bill of lading
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-800 dark:text-zinc-200">{bol}</p>
                </div>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="px-2 py-3 text-sm text-zinc-500 dark:text-zinc-400">No documents yet.</p>
        )}
      </div>
    </div>
  );
}
