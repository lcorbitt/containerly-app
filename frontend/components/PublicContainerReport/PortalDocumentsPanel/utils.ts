import type { PortalAttachment } from "@shared/dto/shipment.dto";
import { attachmentUploaderKindLabel } from "@shared/dto/attachment.dto";

export function isPortalDocumentReviewable(
  attachment: PortalAttachment,
  readOnlyReview: boolean,
): boolean {
  if (readOnlyReview) return false;
  if (attachment.document_group !== "draft" && attachment.document_group !== "revision") return false;
  return attachment.approval_status !== "approved";
}

export function portalDocumentMetadataLine(attachment: PortalAttachment): string {
  return [
    attachment.uploaded_by_kind ? attachmentUploaderKindLabel(attachment.uploaded_by_kind) : null,
    attachment.document_type,
    attachment.document_group,
    attachment.approval_status,
    attachment.container_number?.trim() || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function portalDocumentScopeLabel(
  attachment: PortalAttachment,
  showScopeLabels: boolean,
): string | null {
  if (!showScopeLabels) return null;
  if (attachment.scope === "shipment" || attachment.container_id == null) {
    return "Entire shipment";
  }
  const unit = attachment.container_number?.trim();
  return unit ? `Unit · ${unit}` : "Unit";
}

export function portalDocumentRowClass(
  approvalStatus: string | null | undefined,
  reviewable: boolean,
  rejectPopoverOpen: boolean,
): string {
  if (approvalStatus === "approved") {
    return "bg-emerald-50/70 dark:bg-emerald-950/20";
  }
  if (approvalStatus === "rejected") {
    return "bg-red-50/40 dark:bg-red-950/15";
  }
  if (rejectPopoverOpen || reviewable) {
    return "bg-amber-50/55 dark:bg-amber-950/20";
  }
  return "bg-white dark:bg-zinc-950";
}

export function portalDocumentStatusBadgeClass(
  approvalStatus: string | null | undefined,
): string | null {
  const status = approvalStatus?.toLowerCase();
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "pending" || status) return "pending";
  return null;
}
