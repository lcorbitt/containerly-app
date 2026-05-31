"use client";

import { FileText } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";
import { createWorkspaceStorageSignedUrl } from "@/services/workspace.service";
import {
  isPdfThumbnailCandidate,
  renderPdfThumbnailDataUrl,
  resolveAttachmentContentType,
} from "@/utils/attachment-thumbnail";
import { isImageThumbnailCandidate } from "@/utils/workspace-files";
import { STORED_FILE_THUMB_BOX_CLASS } from "./constants";
import type { StoredFileThumbnailProps } from "./types";

export type { StoredFileThumbnailProps } from "./types";

function FileIconPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ""}`}>
      <FileText className="h-5 w-5 text-zinc-400" strokeWidth={2} aria-hidden />
    </div>
  );
}

function StoredFileThumbnailInner({
  storagePath,
  href,
  className,
  tryImage,
  tryPdf,
}: {
  storagePath?: string | null;
  href?: string | null;
  className?: string;
  tryImage: boolean;
  tryPdf: boolean;
}) {
  const directUrl = useMemo(() => {
    if (!tryImage && !tryPdf) return null;
    const direct = href?.trim();
    const path = storagePath?.trim();
    if (direct && !path) return direct;
    return null;
  }, [tryImage, tryPdf, href, storagePath]);

  const [fetchedUrl, setFetchedUrl] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (directUrl) return;
    if (!tryImage && !tryPdf) return;

    const path = storagePath?.trim();
    if (!path) return;

    let cancelled = false;
    void (async () => {
      try {
        const url = await createWorkspaceStorageSignedUrl(path, 3600);
        if (!cancelled) setFetchedUrl(url);
      } catch {
        if (!cancelled) setLoadFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [directUrl, tryImage, tryPdf, storagePath]);

  const signedUrl = directUrl ?? fetchedUrl;
  const imagePreviewUrl = tryImage && signedUrl ? signedUrl : null;

  useEffect(() => {
    if (!tryPdf || tryImage || !signedUrl) return;

    let cancelled = false;
    void (async () => {
      const dataUrl = await renderPdfThumbnailDataUrl(signedUrl);
      if (cancelled) return;
      if (dataUrl) setPdfPreviewUrl(dataUrl);
      else setLoadFailed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [tryPdf, tryImage, signedUrl]);

  const previewUrl = imagePreviewUrl ?? pdfPreviewUrl;
  const showPreview = (tryImage || tryPdf) && Boolean(previewUrl) && !loadFailed;
  const boxClass = className ?? STORED_FILE_THUMB_BOX_CLASS;

  return (
    <div className={boxClass}>
      {showPreview && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- signed URL or canvas data URL
        <img
          src={previewUrl}
          alt=""
          className="h-full w-full object-cover object-top"
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <FileIconPlaceholder className="h-full w-full" />
      )}
    </div>
  );
}

export const StoredFileThumbnail = memo(function StoredFileThumbnail({
  name,
  contentType,
  storagePath,
  href,
  className,
}: StoredFileThumbnailProps) {
  const resolvedType = resolveAttachmentContentType(contentType, name);
  const tryImage = isImageThumbnailCandidate(resolvedType, name);
  const tryPdf = isPdfThumbnailCandidate(contentType ?? null, name);
  const remountKey = [contentType ?? "", storagePath ?? "", href ?? ""].join("\0");

  return (
    <StoredFileThumbnailInner
      key={remountKey}
      storagePath={storagePath}
      href={href}
      className={className}
      tryImage={tryImage}
      tryPdf={tryPdf}
    />
  );
});
