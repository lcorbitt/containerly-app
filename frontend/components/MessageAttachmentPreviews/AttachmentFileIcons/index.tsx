import { FileText } from "lucide-react";
import { attachmentIsPdf } from "../utils";
import {
  MESSAGE_ATTACHMENT_PDF_ICON_BADGE_CLASS,
  MESSAGE_ATTACHMENT_PDF_ICON_BOX_CLASS,
  MESSAGE_ATTACHMENT_PDF_ICON_LABEL_CLASS,
} from "../constants";

export function AttachmentPdfIconPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`${MESSAGE_ATTACHMENT_PDF_ICON_BOX_CLASS} ${className ?? ""}`}>
      <FileText className="h-7 w-7 text-red-500 dark:text-red-400" strokeWidth={1.75} aria-hidden />
      <span className={MESSAGE_ATTACHMENT_PDF_ICON_BADGE_CLASS}>PDF</span>
    </div>
  );
}

export function AttachmentGenericFileIconPlaceholder({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className ?? ""}`}>
      <FileText className="h-6 w-6 text-zinc-400" strokeWidth={2} aria-hidden />
    </div>
  );
}

export function AttachmentPdfIconLabel({ className }: { className?: string }) {
  return <span className={`${MESSAGE_ATTACHMENT_PDF_ICON_LABEL_CLASS} ${className ?? ""}`}>PDF</span>;
}

export function DocumentFileIcon({
  contentType,
  fileName,
  className,
}: {
  contentType?: string | null;
  fileName: string;
  className?: string;
}) {
  if (attachmentIsPdf(contentType, fileName)) {
    return <AttachmentPdfIconPlaceholder className={className} />;
  }
  return <AttachmentGenericFileIconPlaceholder className={className} />;
}
