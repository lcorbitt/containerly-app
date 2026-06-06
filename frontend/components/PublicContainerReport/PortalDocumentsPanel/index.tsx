"use client";

import { ExternalLink, FilePlus2, Loader2 } from "lucide-react";
import { DocumentFileIcon } from "@/components/MessageAttachmentPreviews/AttachmentFileIcons";
import { DOCUMENTS_LIST_ADD_LABEL } from "@/components/DocumentsList/constants";
import { useEffect, useRef, useState } from "react";
import {
  APPROVE_BUTTON_CLASS,
  APPROVED_STATUS_BADGE_CLASS,
  OPEN_LINK_CLASS,
  PENDING_STATUS_BADGE_CLASS,
  PORTAL_DOCUMENTS_ACTIONS_CLASS,
  PORTAL_DOCUMENTS_EMPTY_CLASS,
  PORTAL_DOCUMENTS_LIST_CLASS,
  PORTAL_DOCUMENTS_PANEL_CLASS,
  PORTAL_DOCUMENTS_UPLOAD_BUTTON_CLASS,
  REJECT_POPOVER_CLASS,
  REJECT_TRIGGER_CLASS,
  REJECTED_STATUS_BADGE_CLASS,
  SCOPE_BADGE_CLASS,
} from "./constants";
import type { PortalDocumentsPanelProps } from "./types";
import {
  isPortalDocumentReviewable,
  portalDocumentMetadataLine,
  portalDocumentRowClass,
  portalDocumentScopeLabel,
  portalDocumentStatusBadgeClass,
} from "./utils";

function StatusBadge({ approvalStatus }: { approvalStatus: string | null | undefined }) {
  const kind = portalDocumentStatusBadgeClass(approvalStatus);
  if (!kind) return null;

  const label =
    approvalStatus === "approved"
      ? "Approved"
      : approvalStatus === "rejected"
        ? "Rejected"
        : approvalStatus === "pending"
          ? "Pending"
          : approvalStatus;

  const className =
    kind === "approved"
      ? APPROVED_STATUS_BADGE_CLASS
      : kind === "rejected"
        ? REJECTED_STATUS_BADGE_CLASS
        : PENDING_STATUS_BADGE_CLASS;

  return <span className={className}>{label}</span>;
}

function PortalDocumentRow({
  attachment,
  showScopeLabels,
  readOnlyReview,
  reviewBusyId,
  rejectReason,
  onRejectReasonChange,
  onOpen,
  onReview,
  rejectPopoverId,
  onRejectPopoverChange,
}: {
  attachment: PortalDocumentsPanelProps["attachments"][number];
  showScopeLabels: boolean;
  readOnlyReview: boolean;
  reviewBusyId: string | null;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  onOpen: (storagePath: string) => void;
  onReview: (attachmentId: string, action: "approve" | "reject") => void | Promise<void>;
  rejectPopoverId: string | null;
  onRejectPopoverChange: (attachmentId: string | null) => void;
}) {
  const rejectPopoverRef = useRef<HTMLDivElement>(null);
  const reviewable = isPortalDocumentReviewable(attachment, readOnlyReview);
  const busy = reviewBusyId === attachment.id;
  const rejectPopoverOpen = rejectPopoverId === attachment.id;
  const scopeLabel = portalDocumentScopeLabel(attachment, showScopeLabels);

  useEffect(() => {
    if (!rejectPopoverOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rejectPopoverRef.current?.contains(event.target as Node)) {
        onRejectPopoverChange(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onRejectPopoverChange(null);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [rejectPopoverOpen, onRejectPopoverChange]);

  async function handleConfirmReject() {
    await onReview(attachment.id, "reject");
    onRejectPopoverChange(null);
  }

  return (
    <li
      className={`border-b border-zinc-100 last:border-b-0 dark:border-zinc-800 ${portalDocumentRowClass(
        attachment.approval_status,
        reviewable,
        rejectPopoverOpen,
      )}`}
    >
      <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <DocumentFileIcon
            contentType={attachment.content_type}
            fileName={attachment.file_name}
            className="mt-0.5 h-8 w-8 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{attachment.file_name}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {portalDocumentMetadataLine(attachment)}
            </p>
            {attachment.rejection_reason ? (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                Rejected: {attachment.rejection_reason}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end sm:gap-3">
          {reviewable ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onReview(attachment.id, "approve")}
                className={APPROVE_BUTTON_CLASS}
              >
                {busy && !rejectPopoverOpen ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Approve
                  </>
                ) : (
                  "Approve"
                )}
              </button>
              <div ref={rejectPopoverRef} className="relative">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    onRejectPopoverChange(rejectPopoverOpen ? null : attachment.id)
                  }
                  className={REJECT_TRIGGER_CLASS}
                  aria-expanded={rejectPopoverOpen}
                  aria-haspopup="dialog"
                >
                  Reject
                </button>
                {rejectPopoverOpen ? (
                  <div
                    role="dialog"
                    aria-label="Reject document"
                    className={REJECT_POPOVER_CLASS}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void handleConfirmReject();
                      }
                    }}
                  >
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">Reject</p>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => onRejectReasonChange(e.target.value)}
                      placeholder="Reason"
                      autoFocus
                      disabled={busy}
                      className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none ring-red-400/30 placeholder:text-zinc-400 focus:ring-2 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={busy || !rejectReason.trim()}
                      onClick={() => void handleConfirmReject()}
                      className="mt-2 w-full rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
                    >
                      {busy ? "Saving…" : "Confirm reject"}
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          <StatusBadge approvalStatus={attachment.approval_status} />

          <button
            type="button"
            onClick={() => onOpen(attachment.storage_path)}
            aria-label="Open document"
            className={OPEN_LINK_CLASS}
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          </button>

          {scopeLabel ? <span className={SCOPE_BADGE_CLASS}>{scopeLabel}</span> : null}
        </div>
      </div>
    </li>
  );
}

export function PortalDocumentsPanel({
  attachments,
  showScopeLabels,
  readOnlyReview,
  reviewBusyId,
  rejectReasonById,
  onRejectReasonChange,
  onOpen,
  onReview,
  showUpload = false,
  uploading = false,
  onAddDocumentsClick,
}: PortalDocumentsPanelProps) {
  const [rejectPopoverId, setRejectPopoverId] = useState<string | null>(null);

  return (
    <div className={PORTAL_DOCUMENTS_PANEL_CLASS}>
      {showUpload && onAddDocumentsClick ? (
        <div className={PORTAL_DOCUMENTS_ACTIONS_CLASS}>
          <button
            type="button"
            disabled={uploading}
            onClick={onAddDocumentsClick}
            className={PORTAL_DOCUMENTS_UPLOAD_BUTTON_CLASS}
          >
            <FilePlus2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            {uploading ? "Uploading…" : DOCUMENTS_LIST_ADD_LABEL}
          </button>
        </div>
      ) : null}

      {attachments.length === 0 ? (
        <p className={PORTAL_DOCUMENTS_EMPTY_CLASS}>No documents yet.</p>
      ) : (
        <ul className={PORTAL_DOCUMENTS_LIST_CLASS}>
          {attachments.map((attachment) => (
            <PortalDocumentRow
              key={attachment.id}
              attachment={attachment}
              showScopeLabels={showScopeLabels}
              readOnlyReview={readOnlyReview}
              reviewBusyId={reviewBusyId}
              rejectReason={rejectReasonById[attachment.id] ?? ""}
              onRejectReasonChange={(reason) => onRejectReasonChange(attachment.id, reason)}
              onOpen={onOpen}
              onReview={onReview}
              rejectPopoverId={rejectPopoverId}
              onRejectPopoverChange={setRejectPopoverId}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
