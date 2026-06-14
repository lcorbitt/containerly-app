import type { ReportActivity, ShipmentMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { PublicTimelineEvent } from "@/types/public-report";
import type {
  ContainerWorkspaceSnapshot,
  OrgShipmentMessageThreadsResult,
  ShipmentMessageThreadSummary,
  WorkspaceQuickSearchRow,
} from "@shared/dto/workspace.dto";

export type {
  ContainerWorkspaceSnapshot,
  OrgShipmentMessageThreadsResult,
  ShipmentMessageThreadSummary,
  WorkspaceQuickSearchRow,
};

export type ContainerWorkspaceLoadResult =
  | { ok: false; error: string; quietAttachmentWarning?: string }
  | {
      ok: true;
      request: TrackingRequest;
      messages: ShipmentMessage[];
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
      messages: ShipmentMessage[];
      attachments: WorkspaceAttachment[];
      messageAuthorByUserId: Record<string, string>;
      messageAuthorEmailByUserId: Record<string, string>;
      profileImagePathByUserId: Record<string, string | null>;
      currentUserId: string;
    };
