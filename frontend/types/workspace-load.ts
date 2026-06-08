import type { ReportActivity, ReportMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
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
      messageAuthorEmailByUserId: Record<string, string>;
      profileImagePathByUserId: Record<string, string | null>;
      activity: ReportActivity[];
      activityEvents: ShipmentActivityEvent[];
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
      messageAuthorEmailByUserId: Record<string, string>;
      profileImagePathByUserId: Record<string, string | null>;
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
  last_author_user_id: string | null;
  /** Resolved display label for the latest message author. */
  last_author_name: string;
  /** Customer email for the latest message author, when applicable. */
  last_author_email: string | null;
  message_count: number;
  /** True when the viewer has not read through the latest message in this thread. */
  is_unread: boolean;
  /** Populated for customer message indexes (logistics partner). */
  organization_id?: string | null;
  organization_name?: string | null;
}

export type OrgShipmentMessageThreadsResult =
  | { ok: false; error: string }
  | { ok: true; threads: ShipmentMessageThreadSummary[] };
