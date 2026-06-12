/** Edge HTTP contracts for workspace domain functions. */

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
      request: Record<string, unknown>;
      messages: Record<string, unknown>[];
      messageAuthorByUserId: Record<string, string>;
      messageAuthorEmailByUserId: Record<string, string>;
      profileImagePathByUserId: Record<string, string | null>;
      activity: Record<string, unknown>[];
      activityEvents: Record<string, unknown>[];
      timeline: Record<string, unknown>[];
      containerRow: ContainerWorkspaceSnapshot;
      bolGroupSiblings: { id: string; container_number: string }[];
      attachments: Record<string, unknown>[];
      quietAttachmentWarning?: string;
    };

export type ShipmentScopeLoadResult =
  | { ok: false; error: string }
  | {
      ok: true;
      messages: Record<string, unknown>[];
      attachments: Record<string, unknown>[];
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
  last_author_name: string;
  last_author_email: string | null;
  message_count: number;
  is_unread: boolean;
  organization_id?: string | null;
  organization_name?: string | null;
}

export type OrgShipmentMessageThreadsResult =
  | { ok: false; error: string }
  | { ok: true; threads: ShipmentMessageThreadSummary[] };

export interface CreateWorkspaceSignedUrlBody {
  storage_path?: string;
  expires_sec?: number;
  download_file_name?: string;
  preview_variant?: string;
}

export interface CreateWorkspaceSignedUrlResponse {
  url: string;
}

export interface PatchReportMessageBody {
  message_id?: string;
  body?: string;
}

export interface PatchWorkspaceAttachmentBody {
  attachment_id?: string;
  file_name?: string;
}

export interface NotifyBolImportBody {
  organization_id?: string;
  shipment_id?: string;
  bill_of_lading?: string;
  container_count?: number;
}
