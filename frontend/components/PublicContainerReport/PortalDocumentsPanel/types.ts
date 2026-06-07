import type { ReactNode } from "react";
import type { PortalAttachment } from "@shared/dto/shipment.dto";

export interface PortalDocumentsPanelProps {
  attachments: PortalAttachment[];
  showScopeLabels: boolean;
  readOnlyReview: boolean;
  reviewBusyId: string | null;
  rejectReasonById: Record<string, string>;
  onRejectReasonChange: (attachmentId: string, reason: string) => void;
  onOpen: (storagePath: string) => void;
  onReview: (attachmentId: string, action: "approve" | "reject") => void | Promise<void>;
  showUpload?: boolean;
  uploading?: boolean;
  onAddDocumentsClick?: () => void;
  /** Inline mail tracking row at top of panel (operator edit or customer read-only). */
  mailTrackingPanel?: ReactNode;
}
