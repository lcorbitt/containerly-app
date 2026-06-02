import type { ShipmentActivityEvent, ShipmentPortalPayload } from "@shared/dto/shipment.dto";
import type {
  CreateShipmentBody,
  CreateShipmentResponse,
  DeleteShipmentBody,
  DeleteShipmentResponse,
  ReviewShipmentDocumentBody,
  ReviewShipmentDocumentResponse,
  UpdateShipmentBody,
  UpdateShipmentRiskBody,
  UpdateShipmentRiskResponse,
  UpdateShipmentResponse,
} from "@shared/dto/logistics.dto";
import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import type { AcceptCustomerInviteResponse } from "@shared/dto/customer-access.dto";
import type { ServiceResult } from "@shared/dto/common.dto";
import type { LookupBolContainersResponse } from "@shared/dto/tracking.dto";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/utils/api-client";
import { profileDisplayName } from "@/utils/author-display-name";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentParticipant,
  TrackingRequest,
} from "@/types/database";
import { loadOperatorTrackingRequestsPageBrowser as loadOperatorTrackingRequestsViaApi } from "@/services/tracking.service";
import type {
  OperatorRequestScope,
  OperatorRequestSortColumn,
  SortDirection as RequestSortDirection,
} from "@/utils/operator-tracking-requests";
/* ------------------------------------------------------------------ */
/*  Private helpers                                                    */
/* ------------------------------------------------------------------ */

function requireEnv(): { base: string; anon: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  return { base: base.replace(/\/$/, ""), anon };
}

async function authFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string } | { error: string; status: number }> {
  const { base, anon } = requireEnv();
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { error: "Not signed in", status: 401 };
  }
  const url = `${base}/functions/v1/${path}`;
  const headers = new Headers(init?.headers);
  headers.set("apikey", anon);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  return { res, text };
}

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Operator Shipments Overview                                        */
/* ------------------------------------------------------------------ */

export type OperatorShipmentScope = "all" | "mine" | "unassigned" | "participating";

export const OPERATOR_SHIPMENT_SORT_COLUMNS = [
  "last_sync_at",
  "created_at",
  "order_number",
  "bill_of_lading",
] as const;

export type OperatorShipmentSortColumn = (typeof OPERATOR_SHIPMENT_SORT_COLUMNS)[number];

export function normalizeOperatorShipmentSortColumn(raw: string | null): OperatorShipmentSortColumn {
  if (raw && (OPERATOR_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as OperatorShipmentSortColumn;
  }
  return "created_at";
}

export type ShipmentOverviewTrackingRow = Pick<
  TrackingRequest,
  | "id"
  | "container_id"
  | "container_number"
  | "status"
  | "last_sync_at"
  | "created_at"
  | "error_message"
  | "source_bill_of_lading"
> & { normalized_number?: string };

export type ShipmentOverviewRow = {
  id: string;
  organization_id: string;
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  customer_name: string | null;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  workflow_status: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
  /** Shipment owner (`shipments.created_by`). */
  owner_user_id: string | null;
  /** Primary operator (`shipments.assignee_user_id`). */
  assignee_user_id: string | null;
  tracking_requests: ShipmentOverviewTrackingRow[] | ShipmentOverviewTrackingRow | null;
};

function pickTrackingRows(
  raw: ShipmentOverviewRow["tracking_requests"],
): ShipmentOverviewTrackingRow[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

export function containerCount(row: ShipmentOverviewRow): number {
  return pickTrackingRows(row.tracking_requests).length;
}

export function pickTrackingRowsExported(row: ShipmentOverviewRow): ShipmentOverviewTrackingRow[] {
  return pickTrackingRows(row.tracking_requests);
}

export function maxLastSyncIso(row: ShipmentOverviewRow): string | null {
  let best: string | null = null;
  for (const tr of pickTrackingRows(row.tracking_requests)) {
    const v = tr.last_sync_at;
    if (!v) continue;
    if (!best || Date.parse(v) > Date.parse(best)) best = v;
  }
  return best;
}

/* ------------------------------------------------------------------ */
/*  Importer Granted Shipments                                         */
/* ------------------------------------------------------------------ */

export const IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS = [
  "order_number",
  "created_at",
  "updated_at",
] as const;

export type ImporterGrantedShipmentSortColumn =
  (typeof IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS)[number];

export function normalizeImporterGrantedShipmentSortColumn(
  raw: string | null,
): ImporterGrantedShipmentSortColumn {
  if (raw && (IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as ImporterGrantedShipmentSortColumn;
  }
  return "created_at";
}

export type NestedContainer = {
  id?: string;
  container_number?: string | null;
  status: string | null;
  last_synced_at: string | null;
  location: Record<string, unknown> | null;
  tracking_requests?:
    | { status: string | null; last_sync_at: string | null }
    | { status: string | null; last_sync_at: string | null }[]
    | null;
};

/** One grant row: shipment-scoped importer access. */
export type ImporterGrantedShipmentRow = {
  /** Shipment id — use for `/shipments/hub/[id]` (shared tracking) and `get-shipment`. */
  id: string;
  access_grant_id: string;
  order_number: string;
  container_number: string;
  status: string;
  last_sync_at: string | null;
  updated_at: string;
  created_at: string;
  containers: NestedContainer | NestedContainer[] | null;
};

/* ------------------------------------------------------------------ */
/*  Shipment Access Tab                                                */
/* ------------------------------------------------------------------ */

export type ShipmentAccessTabSnapshot = {
  assigneeUserId: string | null;
  participantRows: ShipmentParticipant[];
  orgPeers: { id: string; label: string }[];
  profileImagePathByUserId: Record<string, string | null>;
  customerAccessRows: ShipmentCustomerAccess[];
  pendingInvites: CustomerInvite[];
  messageAuthorByUserId: Record<string, string>;
  tags: string[];
  orgTagSuggestions: string[];
  emailNotificationsSubscribed: boolean;
};

export async function fetchShipmentAccessTabSnapshotForBrowser(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<ShipmentAccessTabSnapshot> {
  const { snapshot } = await apiJson<{ snapshot: ShipmentAccessTabSnapshot }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/access-tab`,
  );
  return snapshot;
}

export async function updateShipmentAssignee(input: {
  shipmentId: string;
  organizationId: string;
  assigneeUserId: string | null;
}): Promise<void> {
  await apiJson<{ ok: true }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/assignee`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignee_user_id: input.assigneeUserId }),
    },
  );
}

export async function updateShipmentTags(input: {
  shipmentId: string;
  organizationId: string;
  tags: string[];
}): Promise<string[]> {
  const r = await apiJson<{ ok: true; tags: string[] }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/tags`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: input.tags }),
    },
  );
  return r.tags;
}

export async function updateShipmentNotificationSubscription(input: {
  shipmentId: string;
  organizationId: string;
  subscribed: boolean;
}): Promise<boolean> {
  const r = await apiJson<{ ok: true; subscribed: boolean }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/notifications`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscribed: input.subscribed }),
    },
  );
  return r.subscribed;
}

export async function insertShipmentParticipant(input: {
  organizationId: string;
  shipmentId: string;
  userId: string;
}): Promise<void> {
  await apiJson<{ ok: true }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipment-participants`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: input.shipmentId, user_id: input.userId }),
    },
  );
}

export async function deleteShipmentParticipantRow(participantRowId: string): Promise<void> {
  await apiJson<{ ok: true }>(`/api/shipment-participants/${encodeURIComponent(participantRowId)}`, {
    method: "DELETE",
  });
}

export async function revokeCustomerInviteRow(inviteId: string): Promise<void> {
  await apiJson<{ ok: true }>(`/api/customer-invites/${encodeURIComponent(inviteId)}/revoke`, {
    method: "POST",
  });
}

export async function revokeShipmentCustomerAccessRow(accessId: string): Promise<void> {
  await apiJson<{ ok: true }>(
    `/api/shipment-customer-access/${encodeURIComponent(accessId)}/revoke`,
    { method: "POST" },
  );
}

/* ------------------------------------------------------------------ */
/*  Shipment Customer Access Settings                                  */
/* ------------------------------------------------------------------ */

export async function updateShipmentCustomerAccessSettings(input: {
  accessId: string;
  visibilitySettings: Record<string, boolean>;
  operatorOverrides: Record<string, string>;
}): Promise<void> {
  await apiJson<{ ok: true }>(
    `/api/shipment-customer-access/${encodeURIComponent(input.accessId)}/settings`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visibility_settings: input.visibilitySettings,
        operator_overrides: input.operatorOverrides,
      }),
    },
  );
}

/* ------------------------------------------------------------------ */
/*  Shipment Workspace Row                                             */
/* ------------------------------------------------------------------ */

export type ShipmentWorkspaceRow = {
  id: string;
  organization_id: string;
  order_number: string;
  carrier_booking_number: string;
  container_number: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  owner_user_id: string | null;
  creator_display_name: string | null;
  assignee_user_id: string | null;
  customer_name: string | null;
  country: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  freight_booking_carrier: string | null;
  vessel: string | null;
  voyage: string | null;
  health_certificate_no: string | null;
  trade_terms: string | null;
  workflow_status: string | null;
  physical_mail_tracking_number: string | null;
  risk_level: string | null;
  risk_message: string | null;
  primary_carrier_status: string | null;
  tracking_requests: ShipmentOverviewTrackingRow[];
  activity_events: ShipmentActivityEvent[];
};

export async function fetchShipmentWorkspaceRowForBrowser(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }> {
  return apiJson<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }>(
    `/api/organizations/${encodeURIComponent(input.organizationId)}/shipments/${encodeURIComponent(input.shipmentId)}/workspace-row`,
  );
}

/* ------------------------------------------------------------------ */
/*  Edge Functions — Shipment Portal                                   */
/* ------------------------------------------------------------------ */

/** Shipment portal payload (assignee, participant, or invited customer grant). */
export async function fetchShipment(shipmentId: string): Promise<
  | { ok: true; data: ShipmentPortalPayload }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch(`get-shipment?shipment_id=${encodeURIComponent(shipmentId)}`, {
      method: "GET",
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string; message?: string };
      return {
        ok: false,
        status: r.res.status,
        error: err?.error ?? err?.message ?? r.res.statusText,
      };
    }
    return { ok: true, data: body as ShipmentPortalPayload };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function postShipmentThreadMessage(args: {
  shipmentId: string;
  containerId?: string;
  body: string;
  authorDisplayName?: string;
  parentMessageId?: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  try {
    const r = await authFetch("post-customer-shipment-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: args.shipmentId,
        ...(args.containerId ? { container_id: args.containerId } : {}),
        body: args.body,
        author_display_name: args.authorDisplayName?.trim() || undefined,
        ...(args.parentMessageId ? { parent_message_id: args.parentMessageId } : {}),
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function acceptImporterInvite(token: string): Promise<
  ServiceResult<AcceptCustomerInviteResponse>
> {
  try {
    const r = await authFetch("accept-customer-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    const data = body as AcceptCustomerInviteResponse;
    return { ok: true, shipment_id: data.shipment_id, shipment_access_id: data.shipment_access_id, already_had_access: data.already_had_access };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Dismiss importer portal profile reminder (Edge: `complete-customer-shipment-setup`). */
export async function completeImporterPortalSetup(shipmentId: string): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("complete-customer-shipment-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createImporterInvite(args: {
  organizationId: string;
  shipmentId: string;
  invitedEmail: string;
  deliveryMode?: "email_invite" | "allowlist_only";
  visibilitySettings?: Record<string, unknown>;
}): Promise<
  | { ok: true; invite_url: string; token?: string; expires_at: string }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("create-customer-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: args.organizationId,
        shipment_id: args.shipmentId,
        invited_email: args.invitedEmail.trim().toLowerCase(),
        delivery_mode: args.deliveryMode ?? "email_invite",
        visibility_settings: args.visibilitySettings,
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    const data = body as { invite_url: string; token?: string; expires_at: string };
    return { ok: true, invite_url: data.invite_url, token: data.token, expires_at: data.expires_at };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/* ------------------------------------------------------------------ */
/*  Edge Functions — Operator                                          */
/* ------------------------------------------------------------------ */

/** Operator preview of what importers see (`preview-customer-shipment` Edge). */
export async function previewImporterPortalShipment(args: {
  shipmentId: string;
  visibilitySettings: Record<string, unknown>;
  operatorOverrides: Record<string, unknown>;
}): Promise<
  | { ok: true; data: ShipmentPortalPayload }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("preview-customer-shipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: args.shipmentId,
        visibility_settings: args.visibilitySettings,
        operator_overrides: args.operatorOverrides,
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true, data: body as ShipmentPortalPayload };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function lookupBolContainers(args: {
  organizationId: string;
  billOfLading: string;
  shippingLine?: string | null;
}): Promise<
  | ({ ok: true } & LookupBolContainersResponse)
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("lookup-bol-containers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: args.organizationId,
        bill_of_lading: args.billOfLading.trim(),
        ...(args.shippingLine?.trim() ? { shipping_line: args.shippingLine.trim() } : {}),
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    const data = body as LookupBolContainersResponse;
    return {
      ok: true,
      bill_of_lading: data.bill_of_lading,
      associated_container_numbers: data.associated_container_numbers ?? [],
      shipping_line_name: data.shipping_line_name ?? null,
      shipping_line_id: data.shipping_line_id ?? null,
      shipping_line: data.shipping_line ?? null,
    };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/* ------------------------------------------------------------------ */
/*  Browser List Loaders                                               */
/* ------------------------------------------------------------------ */

export async function loadImporterGrantedShipmentsPageBrowser(args: {
  page: number;
  pageSize: number;
  sortColumn: ImporterGrantedShipmentSortColumn;
  sortDirection: SortDirection;
  search: string;
}) {
  const { data: auth } = await createClient().auth.getUser();
  if (!auth.user?.id) return { rows: [], totalCount: 0 };
  return apiJson<{ rows: ImporterGrantedShipmentRow[]; totalCount: number }>(
    "/api/me/importer-shipments/page",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: args.page,
        pageSize: args.pageSize,
        sortColumn: args.sortColumn,
        sortDirection: args.sortDirection,
        search: args.search,
      }),
    },
  );
}

export async function loadOperatorShipmentsOverviewPageBrowser(args: {
  organizationId: string;
  scope: OperatorShipmentScope;
  search: string;
  sortColumn: OperatorShipmentSortColumn;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams({
    page: String(args.page),
    pageSize: String(args.pageSize),
    scope: args.scope,
    search: args.search,
    sortColumn: args.sortColumn,
    sortDirection: args.sortDirection,
  });
  return apiJson<{ rows: ShipmentOverviewRow[]; totalCount: number }>(
    `/api/organizations/${encodeURIComponent(args.organizationId)}/operator-shipments?${params}`,
  );
}

export async function loadOperatorTrackingRequestsPageBrowser(args: {
  organizationId: string;
  scope: OperatorRequestScope;
  page: number;
  pageSize: number;
  sortColumn: OperatorRequestSortColumn;
  sortDirection: RequestSortDirection;
  search: string;
}) {
  return loadOperatorTrackingRequestsViaApi(args);
}

/* ------------------------------------------------------------------ */
/*  Shipment Pick                                                      */
/* ------------------------------------------------------------------ */

export type ShipmentPickRow = {
  id: string;
  order_number: string;
  created_at: string;
};

export async function fetchOrganizationShipmentsForTrackingPick(
  organizationId: string,
  limit = 200,
): Promise<ShipmentPickRow[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const { rows } = await apiJson<{ rows: ShipmentPickRow[] }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/shipments/pick?${params}`,
  );
  return rows ?? [];
}

export async function createCommercialShipment(
  body: CreateShipmentBody,
): Promise<{ ok: true; data: CreateShipmentResponse } | { ok: false; status: number; error: string }> {
  try {
    const r = await authFetch(EDGE_FUNCTION_SLUGS.shipments.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if ("error" in r) return { ok: false, status: r.status, error: r.error };
    let parsed: unknown = r.text;
    try {
      parsed = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = parsed as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true, data: parsed as CreateShipmentResponse };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateShipmentRisk(
  body: UpdateShipmentRiskBody,
): Promise<
  { ok: true; data: UpdateShipmentRiskResponse } | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch(EDGE_FUNCTION_SLUGS.shipments.updateRisk, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if ("error" in r) return { ok: false, status: r.status, error: r.error };
    let parsed: unknown = r.text;
    try {
      parsed = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = parsed as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true, data: parsed as UpdateShipmentRiskResponse };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function updateCommercialShipment(
  body: UpdateShipmentBody,
): Promise<{ ok: true; data: UpdateShipmentResponse } | { ok: false; status: number; error: string }> {
  try {
    const r = await authFetch(EDGE_FUNCTION_SLUGS.shipments.update, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if ("error" in r) return { ok: false, status: r.status, error: r.error };
    let parsed: unknown = r.text;
    try {
      parsed = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = parsed as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true, data: parsed as UpdateShipmentResponse };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteCommercialShipment(
  body: DeleteShipmentBody,
): Promise<{ ok: true; data: DeleteShipmentResponse } | { ok: false; status: number; error: string }> {
  try {
    const data = await apiJson<DeleteShipmentResponse>(
      `/api/organizations/${encodeURIComponent(body.organization_id)}/shipments/${encodeURIComponent(body.shipment_id)}`,
      { method: "DELETE" },
    );
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      status: 400,
      error: e instanceof Error ? e.message : "Could not delete shipment",
    };
  }
}

export async function reviewShipmentDocument(
  body: ReviewShipmentDocumentBody,
): Promise<
  { ok: true; data: ReviewShipmentDocumentResponse } | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch(EDGE_FUNCTION_SLUGS.shipments.reviewDocument, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if ("error" in r) return { ok: false, status: r.status, error: r.error };
    let parsed: unknown = r.text;
    try {
      parsed = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = parsed as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true, data: parsed as ReviewShipmentDocumentResponse };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
