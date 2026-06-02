import {
  isPdfThumbnailCandidate,
  resolveAttachmentContentType,
} from "@/utils/attachment-thumbnail";
import { isImageThumbnailCandidate } from "@/utils/workspace-files";

export function attachmentIsPdf(
  contentType: string | null | undefined,
  fileName: string,
): boolean {
  const resolved = resolveAttachmentContentType(contentType, fileName);
  return (
    isPdfThumbnailCandidate(contentType ?? null, fileName) &&
    !isImageThumbnailCandidate(resolved, fileName)
  );
}
