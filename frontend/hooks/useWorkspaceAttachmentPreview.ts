"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStorageSignedUrl } from "@/hooks/queries/useWorkspaceStorageSignedUrl";
import { useLazyInView } from "@/hooks/useLazyInView";
import {
  isPdfThumbnailCandidate,
  renderPdfThumbnailDataUrl,
  resolveAttachmentContentType,
} from "@/utils/attachment-thumbnail";
import { isImageThumbnailCandidate } from "@/utils/workspace-files";
import type { WorkspaceStoragePreviewVariant } from "@/utils/workspace-storage-preview";

const PDF_INLINE_MAX_WIDTH = 400;

export function useWorkspaceAttachmentPreview(input: {
  storagePath: string;
  contentType: string | null | undefined;
  fileName: string;
  /** `inline` = message-style preview; `thumb` = document list chip. */
  displayVariant: Extract<WorkspaceStoragePreviewVariant, "inline" | "thumb">;
  /** Defer signed URL + PDF render until near viewport (default true for inline). */
  lazy?: boolean;
  /** `preview` renders first page via pdf.js; `icon` shows a PDF badge only (messages). */
  pdfDisplay?: "preview" | "icon";
  pdfPreviewMaxWidth?: number;
}) {
  const lazy = input.lazy ?? input.displayVariant === "inline";
  const pdfDisplay = input.pdfDisplay ?? (input.displayVariant === "inline" ? "icon" : "preview");
  const { ref, inView } = useLazyInView({ rootMargin: input.displayVariant === "inline" ? "320px" : "120px" });

  const resolvedType = useMemo(
    () => resolveAttachmentContentType(input.contentType, input.fileName),
    [input.contentType, input.fileName],
  );
  const tryImage = isImageThumbnailCandidate(resolvedType, input.fileName);
  const tryPdf = isPdfThumbnailCandidate(input.contentType ?? null, input.fileName);
  const pdfPreviewMaxWidth =
    input.pdfPreviewMaxWidth ??
    (input.displayVariant === "inline" ? PDF_INLINE_MAX_WIDTH : 128);

  const isPdfFile = tryPdf && !tryImage;
  const renderPdfPreview = isPdfFile && pdfDisplay === "preview";

  const loadEnabled = Boolean(input.storagePath.trim()) && (!lazy || inView);

  const imageQuery = useWorkspaceStorageSignedUrl({
    storagePath: input.storagePath,
    previewVariant: input.displayVariant,
    enabled: loadEnabled && tryImage,
  });

  const pdfSourceQuery = useWorkspaceStorageSignedUrl({
    storagePath: input.storagePath,
    previewVariant: "original",
    enabled: loadEnabled && renderPdfPreview,
  });

  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFailed, setPdfFailed] = useState(false);

  useEffect(() => {
    if (!renderPdfPreview || !pdfSourceQuery.data) {
      setPdfPreviewUrl(null);
      setPdfFailed(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const dataUrl = await renderPdfThumbnailDataUrl(pdfSourceQuery.data, pdfPreviewMaxWidth);
      if (cancelled) return;
      if (dataUrl) {
        setPdfPreviewUrl(dataUrl);
        setPdfFailed(false);
      } else {
        setPdfPreviewUrl(null);
        setPdfFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [renderPdfPreview, pdfSourceQuery.data, pdfPreviewMaxWidth]);

  const imageUrl = tryImage ? (imageQuery.data ?? null) : null;
  const showImage = Boolean(imageUrl) && !imageQuery.isError;
  const showPdf = renderPdfPreview && Boolean(pdfPreviewUrl) && !pdfFailed;

  const isLoading =
    loadEnabled &&
    ((tryImage && imageQuery.isLoading) ||
      (renderPdfPreview &&
        (pdfSourceQuery.isLoading || (!pdfPreviewUrl && !pdfFailed && !pdfSourceQuery.isError))));

  const failed =
    loadEnabled &&
    ((tryImage && imageQuery.isError) || (renderPdfPreview && (pdfSourceQuery.isError || pdfFailed)));

  return {
    ref,
    inView,
    tryImage,
    isPdfFile,
    tryPdf: isPdfFile,
    imageUrl,
    pdfPreviewUrl,
    showImage,
    showPdf,
    isLoading,
    failed,
    /** Full-size URL for open-in-tab (lazy: only after near viewport). */
    openUrl: pdfSourceQuery.data ?? imageQuery.data ?? null,
  };
}
