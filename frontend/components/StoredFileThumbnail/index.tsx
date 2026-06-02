"use client";

import { Loader2 } from "lucide-react";
import { memo } from "react";
import {
  AttachmentGenericFileIconPlaceholder,
  AttachmentPdfIconPlaceholder,
} from "@/components/MessageAttachmentPreviews/AttachmentFileIcons";
import { attachmentIsPdf } from "@/components/MessageAttachmentPreviews/utils";
import { useWorkspaceAttachmentPreview } from "@/hooks/useWorkspaceAttachmentPreview";
import { STORED_FILE_THUMB_BOX_CLASS } from "./constants";
import type { StoredFileThumbnailProps } from "./types";

export type { StoredFileThumbnailProps } from "./types";

function FileIconPlaceholder({
  className,
  contentType,
  fileName,
}: {
  className?: string;
  contentType?: string | null;
  fileName: string;
}) {
  if (attachmentIsPdf(contentType, fileName)) {
    return <AttachmentPdfIconPlaceholder className={className} />;
  }
  return <AttachmentGenericFileIconPlaceholder className={className} />;
}

function StoredFileThumbnailInner({
  storagePath,
  href,
  className,
  contentType,
  name,
}: StoredFileThumbnailProps) {
  const directHref = href?.trim() && !storagePath?.trim() ? href.trim() : null;

  const {
    ref,
    isLoading,
    showImage,
    showPdf,
    imageUrl,
    pdfPreviewUrl,
  } = useWorkspaceAttachmentPreview({
    storagePath: storagePath ?? "",
    contentType,
    fileName: name,
    displayVariant: "thumb",
    // Thumbnails are shown inside scroll containers; avoid relying on IntersectionObserver.
    lazy: false,
  });

  const boxClass = className ?? STORED_FILE_THUMB_BOX_CLASS;
  const previewSrc = directHref ?? (showImage ? imageUrl : pdfPreviewUrl);

  if (isLoading && !directHref) {
    return (
      <div ref={ref} className={`${boxClass} flex items-center justify-center`}>
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" aria-hidden />
      </div>
    );
  }

  if (previewSrc && (directHref || showImage || showPdf)) {
    return (
      <div ref={ref} className={boxClass}>
        {/* eslint-disable-next-line @next/next/no-img-element -- signed URL or canvas data URL */}
        <img
          src={previewSrc}
          alt=""
          decoding="async"
          loading="lazy"
          fetchPriority="low"
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div ref={ref} className={boxClass}>
      <FileIconPlaceholder className="h-full w-full" contentType={contentType} fileName={name} />
    </div>
  );
}

export const StoredFileThumbnail = memo(function StoredFileThumbnail(props: StoredFileThumbnailProps) {
  const remountKey = [props.contentType ?? "", props.storagePath ?? "", props.href ?? ""].join("\0");
  return <StoredFileThumbnailInner key={remountKey} {...props} />;
});
