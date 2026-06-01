import type { ReportActivity, ReportMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

export type ContainerWorkspaceSnapshot = {
  shipment_id: string | null;
  status: string | null;
  carrier: string | null;
  location: Record<string, unknown> | null;
  last_synced_at: string | null;
  enrichment: Record<string, unknown> | null;
};

export type ContainerWorkspaceLoadResult =
  | { ok: false; error: string; quietAttachmentWarning?: string }
  | {
      ok: true;
      request: TrackingRequest;
      messages: ReportMessage[];
      messageAuthorByUserId: Record<string, string>;
      activity: ReportActivity[];
      timeline: PublicTimelineEvent[];
      containerRow: ContainerWorkspaceSnapshot;
      bolGroupSiblings: { id: string; container_number: string }[];
      attachments: WorkspaceAttachment[];
      quietAttachmentWarning?: string;
    };

export type ShipmentScopeLoadResult =
  | { ok: false; error: string }
  | {
      ok: true;
      messages: ReportMessage[];
      attachments: WorkspaceAttachment[];
      messageAuthorByUserId: Record<string, string>;
      currentUserId: string;
    };

export type WorkspaceQuickSearchRow = {
  kind: string;
  id: string;
  title: string;
  subtitle: string | null;
  path: string;
};

export interface ShipmentMessageThreadSummary {
  shipment_id: string;
  order_number: string | null;
  last_message_at: string;
  last_message_preview: string;
  last_author_kind: string;
  message_count: number;
}

export type OrgShipmentMessageThreadsResult =
  | { ok: false; error: string }
  | { ok: true; threads: ShipmentMessageThreadSummary[] };
