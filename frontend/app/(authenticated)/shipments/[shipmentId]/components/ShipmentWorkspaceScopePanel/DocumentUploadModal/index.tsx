"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { SHIPMENT_DOCUMENT_TYPES } from "@shared/dto/logistics.dto";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  MAX_ATTACHMENT_SIZE_LABEL,
} from "@/utils/workspace-files";

export type DocumentUploadGroup = "draft" | "revision" | "original";

type DocumentUploadModalProps = {
  open: boolean;
  onClose: () => void;
  initialFiles?: File[];
  showDocumentMetadata: boolean;
  documentType: string;
  onDocumentTypeChange: (value: string) => void;
  documentGroup: DocumentUploadGroup;
  onDocumentGroupChange: (value: DocumentUploadGroup) => void;
  uploading: boolean;
  onUpload: (files: File[]) => void | Promise<void>;
};

const fieldClass =
  "mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function mergeFiles(existing: File[], incoming: File[]): File[] {
  const combined = [...existing, ...incoming];
  return combined.slice(0, MAX_ATTACHMENTS_PER_MESSAGE);
}

export function DocumentUploadModal({
  open,
  onClose,
  initialFiles = [],
  showDocumentMetadata,
  documentType,
  onDocumentTypeChange,
  documentGroup,
  onDocumentGroupChange,
  uploading,
  onUpload,
}: DocumentUploadModalProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setPendingFiles(initialFiles.length > 0 ? mergeFiles([], initialFiles) : []);
      setDragOver(false);
      setLocalError(null);
    }
    if (!open) {
      setPendingFiles([]);
      setDragOver(false);
      setLocalError(null);
    }
    wasOpenRef.current = open;
  }, [open, initialFiles]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !uploading) {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, uploading, onClose]);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list?.length) return;
    setLocalError(null);
    setPendingFiles((prev) => mergeFiles(prev, Array.from(list)));
  }, []);

  const removePending = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleSubmit() {
    if (!pendingFiles.length || uploading) return;
    setLocalError(null);
    try {
      await onUpload(pendingFiles);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Upload failed");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] dark:bg-black/70"
        onClick={() => !uploading && onClose()}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-[101] m-0 w-full max-w-lg border-0 bg-white shadow-2xl outline-none dark:bg-zinc-950 sm:rounded-2xl sm:border sm:border-zinc-200 dark:sm:border-zinc-700"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Upload document
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Add files to this shipment. Up to {MAX_ATTACHMENTS_PER_MESSAGE} files, {MAX_ATTACHMENT_SIZE_LABEL} each.
            </p>
          </div>
          <DialogCloseButton onClick={onClose} />
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          {showDocumentMetadata ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Document type
                <select
                  value={documentType}
                  onChange={(e) => onDocumentTypeChange(e.target.value)}
                  disabled={uploading}
                  className={fieldClass}
                >
                  {SHIPMENT_DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Document group
                <select
                  value={documentGroup}
                  onChange={(e) => onDocumentGroupChange(e.target.value as DocumentUploadGroup)}
                  disabled={uploading}
                  className={fieldClass}
                >
                  <option value="draft">Draft</option>
                  <option value="revision">Revision</option>
                  <option value="original">Original</option>
                </select>
              </label>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">File</p>
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={`mt-1.5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                dragOver
                  ? "border-sky-400 bg-sky-50/80 dark:border-sky-600 dark:bg-sky-950/30"
                  : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-900/30"
              }`}
            >
              <Upload className="h-8 w-8 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} aria-hidden />
              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Drag and drop files here
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">or</p>
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Select file
              </button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="sr-only"
                aria-label="Select files from computer"
                disabled={uploading}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </div>

          {pendingFiles.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Selected files</p>
              <ul className="mt-1.5 divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                {pendingFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate text-zinc-800 dark:text-zinc-200">{file.name}</span>
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => removePending(index)}
                      className="shrink-0 text-xs font-medium text-zinc-500 underline hover:text-zinc-800 disabled:opacity-50 dark:hover:text-zinc-200"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {localError ? <p className="text-sm text-red-600 dark:text-red-400">{localError}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={uploading || pendingFiles.length === 0}
            onClick={() => void handleSubmit()}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
