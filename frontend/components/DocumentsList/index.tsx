"use client";

import { Check, FilePlus2, FileText, Loader2, Pencil, Trash2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { StoredFileThumbnail } from "@/components/StoredFileThumbnail";
import { TextInput } from "@/components/TextInput";
import { attachmentUploaderKindLabel } from "@shared/dto/attachment.dto";
import {
  DOCUMENT_GROUP_PILL_CLASS,
  DOCUMENTS_LIST_ADD_LABEL,
  DOCUMENTS_LIST_UPLOAD_LABEL,
  DOCUMENT_TYPE_PILL_CLASS,
} from "./constants";
import type { DocumentsListProps } from "./types";
import { formatDocumentGroupLabel, hasDocumentMetadata } from "./utils";

export type { DocumentsListStoredFile, DocumentsListProps } from "./types";

export function DocumentsList({
  billOfLading,
  storedFiles,
  onPickFiles,
  onUploadClick,
  uploading,
  onRemoveFile,
  removingFileId,
  currentUserId,
  onRenameFile,
  renamingFileId,
  variant = "card",
  hideHeader = false,
  naturalHeight = false,
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
  const opensUploadModal = Boolean(onUploadClick && !onPickFiles);
  const uploadActionLabel = opensUploadModal ? DOCUMENTS_LIST_ADD_LABEL : DOCUMENTS_LIST_UPLOAD_LABEL;
  const UploadActionIcon = opensUploadModal ? FilePlus2 : Upload;
  const shell =
    variant === "embedded"
      ? naturalHeight
        ? "flex flex-col rounded-none border-0 bg-transparent shadow-none dark:bg-transparent"
        : "flex min-h-0 flex-1 flex-col overflow-hidden rounded-none border-0 bg-transparent shadow-none dark:bg-transparent"
      : "flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-[min(320px,calc(100dvh-14rem))]";

  return (
    <div className={shell}>
      {!hideHeader ? (
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</h2>
        {onUploadClick || onPickFiles ? (
          <>
            {onPickFiles && !onUploadClick ? (
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
            ) : null}
            <button
              type="button"
              disabled={uploading}
              onClick={() => (onUploadClick ? onUploadClick() : inputRef.current?.click())}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <UploadActionIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
              {uploadActionLabel}
            </button>
          </>
        ) : null}
      </div>
      ) : onUploadClick || onPickFiles ? (
        <div className="flex shrink-0 justify-start border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
          {onPickFiles && !onUploadClick ? (
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
          ) : null}
          <button
            type="button"
            disabled={uploading}
            onClick={() => (onUploadClick ? onUploadClick() : inputRef.current?.click())}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <UploadActionIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            )}
            {uploadActionLabel}
          </button>
        </div>
      ) : null}
      <div
        className={
          variant === "embedded" && naturalHeight
            ? "px-2 py-2"
            : "min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2"
        }
      >
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
                  <div className="flex items-center gap-1 rounded-md py-0.5 pr-1 pl-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditing) void open();
                      }}
                      disabled={busy || isEditing}
                      tabIndex={isEditing ? -1 : undefined}
                      aria-hidden={isEditing ? true : undefined}
                      className={`shrink-0 rounded-md p-1.5 transition-colors disabled:cursor-default ${
                        isEditing
                          ? "pointer-events-none"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
                      }`}
                    >
                      <StoredFileThumbnail
                        name={f.name}
                        contentType={f.contentType}
                        storagePath={f.storagePath}
                        href={f.href}
                      />
                    </button>
                    {isEditing ? (
                      <div className="flex min-w-0 flex-1 flex-col gap-2 px-0.5 py-2">
                        <TextInput
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
                    ) : (
                      <button
                        type="button"
                        onClick={() => void open()}
                        disabled={busy}
                        className="flex min-w-0 flex-1 rounded-md px-1.5 py-2 text-left text-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed dark:hover:bg-zinc-900/60"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium wrap-break-word text-zinc-800 dark:text-zinc-200">
                            {f.name}
                          </span>
                          {hasDocumentMetadata(f.documentType, f.documentGroup) ? (
                            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {f.documentType?.trim() ? (
                                <span className={DOCUMENT_TYPE_PILL_CLASS} title="Document type">
                                  {f.documentType.trim()}
                                </span>
                              ) : null}
                              {formatDocumentGroupLabel(f.documentGroup) ? (
                                <span className={DOCUMENT_GROUP_PILL_CLASS} title="Document group">
                                  {formatDocumentGroupLabel(f.documentGroup)}
                                </span>
                              ) : null}
                            </span>
                          ) : null}
                          {f.uploadedByLabel?.trim() || f.uploadedByKind === "customer" ? (
                            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {f.uploadedByKind === "customer" ? (
                                <span
                                  className="inline-flex rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-900 dark:bg-sky-950/60 dark:text-sky-200"
                                >
                                  {attachmentUploaderKindLabel(f.uploadedByKind)}
                                </span>
                              ) : null}
                              {f.uploadedByLabel?.trim() ? (
                                <span className="font-medium text-zinc-600 dark:text-zinc-300">
                                  {f.uploadedByLabel.trim()}
                                </span>
                              ) : null}
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
                        className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
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
                        className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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
          <p className="px-2 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No documents yet.</p>
        )}
      </div>
    </div>
  );
}
