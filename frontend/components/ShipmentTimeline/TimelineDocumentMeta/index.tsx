import {
  DOCUMENT_GROUP_PILL_CLASS,
  DOCUMENT_TYPE_PILL_CLASS,
} from "@/components/DocumentsList/constants";
import {
  APPROVAL_STATUS_PILL_CLASS,
  DEFAULT_APPROVAL_STATUS_PILL_CLASS,
  DOCUMENT_FILE_LIST_CLASS,
  DOCUMENT_FILE_LIST_ITEM_CLASS,
  DOCUMENT_FILE_LIST_MORE_CLASS,
  FILE_COUNT_CLASS,
  REJECTION_REASON_CLASS,
  TIMELINE_DOCUMENT_PREVIEW_LIMIT,
} from "./constants";
import type { TimelineDocumentMetaProps } from "./types";
import {
  formatApprovalStatusLabel,
  hasTimelineDocumentMeta,
  isBatchDocumentUploadMeta,
} from "../utils";
import {
  formatDocumentGroupLabel,
  formatDocumentTypeLabel,
} from "@/utils/document-metadata-display";

function resolveDocumentFileNames(meta: TimelineDocumentMetaProps["meta"]): string[] {
  const fromDocuments = (meta.documents ?? [])
    .map((item) => item.fileName?.trim())
    .filter((name): name is string => Boolean(name));
  if (fromDocuments.length > 0) return fromDocuments;
  if (meta.fileName?.trim()) return [meta.fileName.trim()];
  return [];
}

export function TimelineDocumentMeta({ meta, compact = true }: TimelineDocumentMetaProps) {
  if (!hasTimelineDocumentMeta(meta)) return null;

  const approvalKey = meta.approvalStatus?.trim().toLowerCase() ?? "";
  const approvalPillClass =
    APPROVAL_STATUS_PILL_CLASS[approvalKey] ?? DEFAULT_APPROVAL_STATUS_PILL_CLASS;
  const isBatch = isBatchDocumentUploadMeta(meta);
  const fileNames = resolveDocumentFileNames(meta);
  const displayCount = meta.fileCount ?? fileNames.length;
  const previewLimit = compact ? TIMELINE_DOCUMENT_PREVIEW_LIMIT : fileNames.length;
  const previewNames = fileNames.slice(0, previewLimit);
  const remainingCount = Math.max(0, fileNames.length - previewNames.length);
  const showStandaloneFileName =
    Boolean(meta.fileName?.trim()) && !isBatch && fileNames.length <= 1;
  const showFileList = previewNames.length > 0 && !showStandaloneFileName;

  return (
    <div className={compact ? "mt-1.5 space-y-1" : "mt-2 space-y-1.5"}>
      {isBatch ? (
        <p className={FILE_COUNT_CLASS}>
          {displayCount} document{displayCount === 1 ? "" : "s"}
        </p>
      ) : showStandaloneFileName ? (
        <p
          className="truncate text-[11px] font-medium leading-snug text-zinc-700 dark:text-zinc-300"
          title={meta.fileName ?? undefined}
        >
          {meta.fileName}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-1">
        {meta.documentGroup ? (
          <span className={DOCUMENT_GROUP_PILL_CLASS} title="Document Group">
            {formatDocumentGroupLabel(meta.documentGroup)}
          </span>
        ) : null}
        {meta.documentType ? (
          <span className={DOCUMENT_TYPE_PILL_CLASS} title="Document Type">
            {formatDocumentTypeLabel(meta.documentType)}
          </span>
        ) : null}
        {meta.approvalStatus ? (
          <span className={approvalPillClass} title="Document status">
            {formatApprovalStatusLabel(meta.approvalStatus)}
          </span>
        ) : null}
      </div>
      {showFileList ? (
        <ul className={DOCUMENT_FILE_LIST_CLASS}>
          {previewNames.map((name, index) => (
            <li key={`${name}-${index}`} className={DOCUMENT_FILE_LIST_ITEM_CLASS} title={name}>
              {name}
            </li>
          ))}
          {remainingCount > 0 ? (
            <li className={DOCUMENT_FILE_LIST_MORE_CLASS}>+ {remainingCount} more</li>
          ) : null}
        </ul>
      ) : null}
      {meta.trackingNumber ? (
        <p className="truncate font-mono text-[10px] text-zinc-600 dark:text-zinc-400" title="Tracking No">
          {meta.trackingNumber}
        </p>
      ) : null}
      {meta.rejectionReason ? (
        <p className={REJECTION_REASON_CLASS} title={meta.rejectionReason}>
          {meta.rejectionReason}
        </p>
      ) : null}
    </div>
  );
}
