const EXTENSION_MIME: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
};

/** Prefer stored MIME; infer from extension when missing or generic. */
export function resolveAttachmentContentType(
  contentType: string | null | undefined,
  fileName: string,
): string {
  const ct = contentType?.toLowerCase().trim() ?? "";
  if (ct && ct !== "application/octet-stream") return ct;
  const ext = fileName.replace(/^.*\./, "").toLowerCase();
  return EXTENSION_MIME[ext] ?? ct;
}

export function isPdfThumbnailCandidate(contentType: string | null, fileName: string): boolean {
  const resolved = resolveAttachmentContentType(contentType, fileName);
  if (resolved === "application/pdf") return true;
  return fileName.replace(/^.*\./, "").toLowerCase() === "pdf";
}

/** Renders the first PDF page to a JPEG data URL for list thumbnails. */
export async function renderPdfThumbnailDataUrl(
  pdfUrl: string,
  maxWidth = 128,
): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();

    const pdf = await pdfjs.getDocument({ url: pdfUrl, withCredentials: false }).promise;
    const page = await pdf.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / Math.max(baseViewport.width, 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    await page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise;
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}
