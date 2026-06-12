"use client";

import { Download, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useWorkspaceAttachmentPreview } from "@/hooks/useWorkspaceAttachmentPreview";
import { useToast } from "@/atoms/toast";
import { isImageThumbnailCandidate } from "@/utils/workspace-files";
import { downloadWorkspaceAttachment } from "@/services/workspace.service";
import type { WorkspaceAttachment } from "@/types/database";
import {
  MESSAGE_ATTACHMENT_ACTION_CLASS,
  MESSAGE_ATTACHMENT_ACTION_OVERLAY_CLASS,
  MESSAGE_ATTACHMENT_COMPOSER_UPLOAD_OVERLAY_CLASS,
  MESSAGE_ATTACHMENT_FILE_CARD_CLASS,
  MESSAGE_ATTACHMENT_FILE_LIST_ITEM_CLASS,
  MESSAGE_ATTACHMENT_IMAGE_PREVIEW_BUTTON_CLASS,
  MESSAGE_ATTACHMENT_IMAGE_PREVIEW_CLASS,
  MESSAGE_ATTACHMENT_PDF_INLINE_CARD_CLASS,
  MESSAGE_ATTACHMENT_PDF_PREVIEW_IMG_CLASS,
  MESSAGE_ATTACHMENT_PDF_PREVIEW_WRAP_CLASS,
  MESSAGE_ATTACHMENT_PREVIEW_LIST_ITEM_CLASS,
  MESSAGE_ATTACHMENT_PREVIEW_SKELETON_CLASS,
  MESSAGE_ATTACHMENT_PREVIEW_WRAP_CLASS,
  THUMB_BOX_COMPOSER,
} from "./constants";
import {
  AttachmentGenericFileIconPlaceholder,
  AttachmentPdfIconPlaceholder,
  DocumentFileIcon,
} from "./AttachmentFileIcons";
import { attachmentIsPdf } from "./utils";

function AttachmentDownloadButton({
  fileName,
  storagePath,
  variant = "overlay",
}: {
  fileName: string;
  storagePath: string;
  variant?: "overlay" | "inline";
}) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadWorkspaceAttachment(storagePath, fileName);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not download file", "error");
    } finally {
      setDownloading(false);
    }
  }

  const className =
    variant === "overlay"
      ? MESSAGE_ATTACHMENT_ACTION_CLASS
      : "shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

  return (
    <button
      type="button"
      aria-label={`Download ${fileName}`}
      disabled={downloading}
      onClick={(e) => {
        e.stopPropagation();
        void handleDownload();
      }}
      className={className}
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}

function MessagePdfAttachmentCard({
  fileName,
  storagePath,
  uploaderLabel,
  onOpen,
  listItemRef,
  listItemClass,
  cardClass,
  iconClass,
}: {
  fileName: string;
  storagePath: string;
  uploaderLabel?: string;
  onOpen: () => void;
  listItemRef?: (el: HTMLElement | null) => void;
  listItemClass: string;
  cardClass: string;
  iconClass: string;
}) {
  return (
    <li ref={listItemRef} className={listItemClass}>
      <div className={cardClass}>
        <AttachmentPdfIconPlaceholder className={iconClass} />
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left text-sm transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <span className="block font-medium wrap-break-word text-zinc-800 dark:text-zinc-200">{fileName}</span>
          {uploaderLabel ? (
            <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">{uploaderLabel}</span>
          ) : null}
        </button>
        <AttachmentDownloadButton fileName={fileName} storagePath={storagePath} variant="inline" />
      </div>
    </li>
  );
}

/** Local `File` in the message composer — object URL thumbnail for images. */
export function ComposerPendingAttachmentChip({
  file,
  index,
  disabled,
  uploading = false,
  onRemove,
}: {
  file: File;
  index: number;
  disabled: boolean;
  uploading?: boolean;
  onRemove: (index: number) => void;
}) {
  const isPdf = attachmentIsPdf(file.type || null, file.name);
  const showImg = isImageThumbnailCandidate(file.type || null, file.name);
  const url = useMemo(() => (showImg ? URL.createObjectURL(file) : null), [file, showImg]);

  useEffect(() => {
    if (!url) return;
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <li className="flex max-w-[min(100%,280px)] items-center gap-2 rounded-md border border-zinc-200/90 bg-white/90 py-1.5 pr-1 pl-1.5 text-xs dark:border-zinc-600 dark:bg-zinc-900/80">
      <div className={`${THUMB_BOX_COMPOSER} relative`}>
        {showImg && url ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: preview URL
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : isPdf ? (
          <AttachmentPdfIconPlaceholder className="h-full w-full" />
        ) : (
          <AttachmentGenericFileIconPlaceholder className="h-full w-full" />
        )}
        {uploading ? (
          <div className={MESSAGE_ATTACHMENT_COMPOSER_UPLOAD_OVERLAY_CLASS} aria-hidden>
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          </div>
        ) : null}
      </div>
      <span className="min-w-0 flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">{file.name}</span>
      {uploading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-zinc-500 dark:text-zinc-400" aria-hidden />
      ) : (
        <button
          type="button"
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          onClick={() => onRemove(index)}
          className="shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </button>
      )}
    </li>
  );
}

/** Saved attachment on a sent message — large inline preview (Discord-style). */
export function StoredMessageAttachmentPreview({
  row,
  uploaderLabel,
  onOpen,
}: {
  row: WorkspaceAttachment;
  uploaderLabel: string;
  onOpen: () => void;
}) {
  const preview = useWorkspaceAttachmentPreview({
    storagePath: row.storage_path,
    contentType: row.content_type,
    fileName: row.file_name,
    displayVariant: "inline",
    lazy: true,
    pdfDisplay: "icon",
  });

  if (preview.isPdfFile) {
    return (
      <MessagePdfAttachmentCard
        fileName={row.file_name}
        storagePath={row.storage_path}
        uploaderLabel={uploaderLabel}
        onOpen={onOpen}
        listItemRef={preview.ref}
        listItemClass={MESSAGE_ATTACHMENT_FILE_LIST_ITEM_CLASS}
        cardClass={MESSAGE_ATTACHMENT_PDF_INLINE_CARD_CLASS}
        iconClass="h-14 w-12 shrink-0"
      />
    );
  }

  const visualPreview = preview.showImage || preview.showPdf;
  const previewSrc = preview.showImage ? preview.imageUrl! : preview.pdfPreviewUrl!;

  if (visualPreview) {
    return (
      <li ref={preview.ref} className={MESSAGE_ATTACHMENT_PREVIEW_LIST_ITEM_CLASS}>
        <div className={MESSAGE_ATTACHMENT_PREVIEW_WRAP_CLASS}>
          <button
            type="button"
            onClick={onOpen}
            className={
              preview.showPdf
                ? MESSAGE_ATTACHMENT_PDF_PREVIEW_WRAP_CLASS
                : MESSAGE_ATTACHMENT_IMAGE_PREVIEW_BUTTON_CLASS
            }
            aria-label={`Open ${row.file_name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- resized signed URL or canvas data URL */}
            <img
              src={previewSrc}
              alt=""
              decoding="async"
              loading="lazy"
              fetchPriority="low"
              className={
                preview.showImage
                  ? MESSAGE_ATTACHMENT_IMAGE_PREVIEW_CLASS
                  : MESSAGE_ATTACHMENT_PDF_PREVIEW_IMG_CLASS
              }
              onError={() => undefined}
            />
          </button>
          <div className={MESSAGE_ATTACHMENT_ACTION_OVERLAY_CLASS}>
            <AttachmentDownloadButton fileName={row.file_name} storagePath={row.storage_path} />
          </div>
        </div>
      </li>
    );
  }

  if (preview.isLoading || (preview.tryImage && !visualPreview && !preview.failed)) {
    return (
      <li ref={preview.ref} className={MESSAGE_ATTACHMENT_PREVIEW_LIST_ITEM_CLASS}>
        <div
          className={MESSAGE_ATTACHMENT_PREVIEW_SKELETON_CLASS}
          style={{ minHeight: "12rem" }}
          aria-hidden
        />
      </li>
    );
  }

  return (
    <li ref={preview.ref} className={MESSAGE_ATTACHMENT_FILE_LIST_ITEM_CLASS}>
      <div className={MESSAGE_ATTACHMENT_FILE_CARD_CLASS}>
        <DocumentFileIcon
          contentType={row.content_type}
          fileName={row.file_name}
          className="h-10 w-10 shrink-0 rounded-md bg-zinc-100 dark:bg-zinc-800/80"
        />
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left text-sm transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <span className="block font-medium wrap-break-word text-zinc-800 dark:text-zinc-200">
            {row.file_name}
          </span>
          <span className="mt-0.5 block text-[11px] text-zinc-500 dark:text-zinc-400">{uploaderLabel}</span>
        </button>
        <AttachmentDownloadButton
          fileName={row.file_name}
          storagePath={row.storage_path}
          variant="inline"
        />
      </div>
    </li>
  );
}

/** @deprecated Use StoredMessageAttachmentPreview */
export const StoredMessageAttachmentButton = StoredMessageAttachmentPreview;
