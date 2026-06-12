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
import type {
  ShipmentContextSummary,
  ShipmentInsightCard,
  ShipmentMetricsSummary,
  ShipmentRootCause,
} from "@shared/dto/performance.dto";
import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import type {
  AcceptCustomerInviteResponse,
  CheckPortalAccessEmailResponse,
  PreviewCustomerInviteResponse,
  ResolveCustomerAccessRequestResponse,
} from "@shared/dto/customer-access.dto";
import type { ServiceResult } from "@shared/dto/common.dto";
import type { LookupBolContainersResponse } from "@shared/dto/tracking.dto";
import { createClient } from "@/lib/supabase/client";
import { edgeFunctionFetch } from "@/lib/supabase/edge-functions";
import {
  OPERATOR_SHIPMENT_SORT_COLUMNS,
  normalizeOperatorShipmentSortColumn,
  type OperatorShipmentSortColumn,
} from "@/utils/operator-shipment-sort";
import type { OperatorShipmentDateRangeFilter } from "@/utils/operator-shipment-date-filters";
import type { ImporterGrantedShipmentSortColumn } from "@/utils/importer-shipment-sort";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentCustomerAccessRequest,
  ShipmentParticipant,
  TrackingRequest,
} from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";
import { loadOperatorTrackingRequestsPageBrowser as loadOperatorTrackingRequestsViaEdge } from "@/services/tracking.service";
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

async function publicEdgeFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string } | { error: string; status: number }> {
  const { base, anon } = requireEnv();
  const url = `${base}/functions/v1/${path}`;
  const headers = new Headers(init?.headers);
  headers.set("apikey", anon);
  headers.set("Authorization", `Bearer ${anon}`);
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  return { res, text };
}

function parseEdgeJson<T>(r: { res: Response; text: string }): T | null {
  try {
    return r.text ? (JSON.parse(r.text) as T) : null;
  } catch {
    return null;
  }
}

async function parseEdgeGetJson<T>(path: string): Promise<T> {
  const result = await edgeFunctionFetch(path, { method: "GET" });
  if ("error" in result) throw new Error(result.error);
  const parsed = parseEdgeJson<T & { error?: string }>(result);
  if (!result.res.ok) {
    throw new Error(parsed?.error ?? result.res.statusText);
  }
  if (!parsed) throw new Error("Invalid response from Edge function");
  return parsed;
}

async function parseEdgePostJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const result = await authFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if ("error" in result) throw new Error(result.error);
  const parsed = parseEdgeJson<T & { error?: string }>(result);
  if (!result.res.ok) {
    throw new Error(parsed?.error ?? result.res.statusText);
  }
  if (!parsed) throw new Error("Invalid response from Edge function");
  return parsed;
}

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc";

/* ------------------------------------------------------------------ */
/*  Operator Shipments Overview                                        */
/* ------------------------------------------------------------------ */

export type OperatorShipmentScope = "all" | "mine" | "unassigned" | "participating";

export {
  OPERATOR_SHIPMENT_SORT_COLUMNS,
  normalizeOperatorShipmentSortColumn,
  type OperatorShipmentSortColumn,
};

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
  consignee: string | null;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  workflow_status: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
  /** Shipment owner (`shipments.created_by`). */
  owner_user_id: string | null;
  /** Primary operator (`shipments.assignee_user_id`). */
  assignee_user_id: string | null;
  tags: string[];
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

export {
  IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS,
  DEFAULT_IMPORTER_GRANTED_SHIPMENT_SORT_COLUMN,
  normalizeImporterGrantedShipmentSortColumn,
  defaultSortDirectionForImporterGrantedShipmentColumn,
  type ImporterGrantedShipmentSortColumn,
} from "@/utils/importer-shipment-sort";

/** One grant row: shipment-scoped importer access (ops overview fields + org). */
export type ImporterGrantedShipmentRow = {
  /** Shipment id — use for `/shipments/hub/[id]` (shared tracking) and `get-shipment`. */
  id: string;
  access_grant_id: string;
  organization_id: string;
  organization_name: string;
  order_number: string;
  customer_name: string | null;
  consignee: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  workflow_status: string | null;
  estimated_departure_at: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
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
  pendingAccessRequests: ShipmentCustomerAccessRequest[];
  messageAuthorByUserId: Record<string, string>;
  customerEmailByUserId: Record<string, string>;
  tags: string[];
  orgTagSuggestions: string[];
  emailNotificationsSubscribed: boolean;
};

export async function getShipmentAccessTab(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<ShipmentAccessTabSnapshot> {
  const params = new URLSearchParams({
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
  });
  const { snapshot } = await parseEdgeGetJson<{ snapshot: ShipmentAccessTabSnapshot }>(
    `${EDGE_FUNCTION_SLUGS.shipments.accessTab}?${params}`,
  );
  return snapshot;
}

export async function updateShipmentAssignee(input: {
  shipmentId: string;
  organizationId: string;
  assigneeUserId: string | null;
}): Promise<void> {
  await parseEdgePostJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.shipments.updateAssignee, {
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
    assignee_user_id: input.assigneeUserId,
  });
}

export async function updateShipmentTags(input: {
  shipmentId: string;
  organizationId: string;
  tags: string[];
}): Promise<string[]> {
  const r = await parseEdgePostJson<{ ok: true; tags: string[] }>(
    EDGE_FUNCTION_SLUGS.shipments.updateTags,
    {
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
      tags: input.tags,
    },
  );
  return r.tags;
}

export async function updateShipmentRootCause(input: {
  shipmentId: string;
  organizationId: string;
  rootCause: ShipmentRootCause | null;
}): Promise<ShipmentRootCause | null> {
  const r = await parseEdgePostJson<{ ok: true; root_cause: ShipmentRootCause | null }>(
    EDGE_FUNCTION_SLUGS.shipments.updateRootCause,
    {
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
      root_cause: input.rootCause,
    },
  );
  return r.root_cause;
}

export async function updateShipmentNotificationSubscription(input: {
  shipmentId: string;
  organizationId: string;
  subscribed: boolean;
}): Promise<boolean> {
  const r = await parseEdgePostJson<{ ok: true; subscribed: boolean }>(
    EDGE_FUNCTION_SLUGS.shipments.updateNotificationSubscription,
    {
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
      subscribed: input.subscribed,
    },
  );
  return r.subscribed;
}

export async function insertShipmentParticipant(input: {
  organizationId: string;
  shipmentId: string;
  userId: string;
}): Promise<void> {
  await parseEdgePostJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.shipments.insertParticipant, {
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
    user_id: input.userId,
  });
}

export async function deleteShipmentParticipantRow(participantRowId: string): Promise<void> {
  await parseEdgePostJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.shipments.deleteParticipant, {
    participant_id: participantRowId,
  });
}

export async function revokeCustomerInviteRow(inviteId: string): Promise<void> {
  await parseEdgePostJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.shipments.revokeCustomerInvite, {
    invite_id: inviteId,
  });
}

export async function revokeShipmentCustomerAccessRow(accessId: string): Promise<void> {
  await parseEdgePostJson<{ ok: true }>(EDGE_FUNCTION_SLUGS.shipments.revokeCustomerAccess, {
    access_id: accessId,
  });
}

/* ------------------------------------------------------------------ */
/*  Shipment Customer Access Settings                                  */
/* ------------------------------------------------------------------ */

export async function updateShipmentCustomerAccessSettings(input: {
  accessId: string;
  visibilitySettings: Record<string, boolean>;
  operatorOverrides: Record<string, string>;
}): Promise<void> {
  await parseEdgePostJson<{ ok: true }>(
    EDGE_FUNCTION_SLUGS.shipments.updateCustomerAccessSettings,
    {
      access_id: input.accessId,
      visibility_settings: input.visibilitySettings,
      operator_overrides: input.operatorOverrides,
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
  consignee: string | null;
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
  tags: string[];
  root_cause: ShipmentRootCause | null;
  carrier_timeline: PublicTimelineEvent[];
  metrics: ShipmentMetricsSummary;
  context: ShipmentContextSummary;
  insight_cards: ShipmentInsightCard[];
  tracking_requests: ShipmentOverviewTrackingRow[];
  activity_events: ShipmentActivityEvent[];
};

export async function fetchShipmentWorkspaceRowForBrowser(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }> {
  const params = new URLSearchParams({
    organization_id: input.organizationId,
    shipment_id: input.shipmentId,
  });
  return parseEdgeGetJson<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }>(
    `${EDGE_FUNCTION_SLUGS.shipments.workspaceRow}?${params}`,
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

export async function checkPortalAccessEmail(args: {
  shipmentId: string;
  email: string;
}): Promise<
  | ({ ok: true } & CheckPortalAccessEmailResponse)
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await publicEdgeFetch(EDGE_FUNCTION_SLUGS.customers.checkPortalAccessEmail, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: args.shipmentId,
        email: args.email.trim().toLowerCase(),
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    const body = parseEdgeJson<CheckPortalAccessEmailResponse & { error?: string }>(r);
    if (!r.res.ok) {
      return { ok: false, status: r.res.status, error: body?.error ?? r.res.statusText };
    }
    if (!body?.message || !body.outcome) {
      return { ok: false, status: 500, error: "Invalid response" };
    }
    return {
      ok: true,
      message: body.message,
      outcome: body.outcome,
      token_hash: body.token_hash,
      token_type: body.token_type,
    };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function resolveCustomerAccessRequest(args: {
  accessRequestId: string;
  action: "approve" | "deny";
}): Promise<
  | ({ ok: true } & ResolveCustomerAccessRequestResponse)
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch(EDGE_FUNCTION_SLUGS.customers.resolveAccessRequest, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_request_id: args.accessRequestId,
        action: args.action,
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    const body = parseEdgeJson<ResolveCustomerAccessRequestResponse & { error?: string }>(r);
    if (!r.res.ok) {
      return { ok: false, status: r.res.status, error: body?.error ?? r.res.statusText };
    }
    if (!body?.ok) {
      return { ok: false, status: 500, error: "Invalid response" };
    }
    return {
      ok: true,
      status: body.status,
      shipment_id: body.shipment_id,
      invite_id: body.invite_id,
    };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function previewCustomerInvite(token: string): Promise<
  | ({ ok: true } & PreviewCustomerInviteResponse)
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await publicEdgeFetch(EDGE_FUNCTION_SLUGS.customers.previewInvite, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.trim() }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    const body = parseEdgeJson<PreviewCustomerInviteResponse & { error?: string }>(r);
    if (!r.res.ok) {
      return { ok: false, status: r.res.status, error: body?.error ?? r.res.statusText };
    }
    if (!body?.invited_email || !body.invited_email_masked || !body.shipment_id?.trim()) {
      return { ok: false, status: 500, error: "Invalid response" };
    }
    return {
      ok: true,
      invited_email: body.invited_email,
      invited_email_masked: body.invited_email_masked,
      org_name: body.org_name,
      shipment_label: body.shipment_label,
      shipment_id: body.shipment_id,
    };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createCustomerInvite(args: {
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
    const r = await authFetch(EDGE_FUNCTION_SLUGS.customers.createInvite, {
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
  dateRangeFilter?: OperatorShipmentDateRangeFilter;
}) {
  const { data: auth } = await createClient().auth.getUser();
  if (!auth.user?.id) return { rows: [], totalCount: 0 };

  const params = new URLSearchParams({
    page: String(args.page),
    pageSize: String(args.pageSize),
    sortColumn: args.sortColumn,
    sortDirection: args.sortDirection,
    search: args.search,
  });
  if (args.dateRangeFilter?.etaFrom) params.set("etaFrom", args.dateRangeFilter.etaFrom);
  if (args.dateRangeFilter?.etaTo) params.set("etaTo", args.dateRangeFilter.etaTo);
  if (args.dateRangeFilter?.etdFrom) params.set("etdFrom", args.dateRangeFilter.etdFrom);
  if (args.dateRangeFilter?.etdTo) params.set("etdTo", args.dateRangeFilter.etdTo);

  return parseEdgeGetJson<{ rows: ImporterGrantedShipmentRow[]; totalCount: number }>(
    `${EDGE_FUNCTION_SLUGS.shipmentsList.importerGranted}?${params}`,
  );
}

export async function loadOperatorShipmentsOverviewPageBrowser(args: {
  organizationId: string;
  scope: OperatorShipmentScope;
  search: string;
  tagFilter?: string | null;
  dateRangeFilter?: OperatorShipmentDateRangeFilter;
  sortColumn: OperatorShipmentSortColumn;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}) {
  const edgeParams = new URLSearchParams({
    organization_id: args.organizationId,
    page: String(args.page),
    pageSize: String(args.pageSize),
    scope: args.scope,
    search: args.search,
    sortColumn: args.sortColumn,
    sortDirection: args.sortDirection,
  });
  if (args.tagFilter?.trim()) {
    edgeParams.set("tagFilter", args.tagFilter.trim());
  }
  if (args.dateRangeFilter?.etaFrom) edgeParams.set("etaFrom", args.dateRangeFilter.etaFrom);
  if (args.dateRangeFilter?.etaTo) edgeParams.set("etaTo", args.dateRangeFilter.etaTo);
  if (args.dateRangeFilter?.etdFrom) edgeParams.set("etdFrom", args.dateRangeFilter.etdFrom);
  if (args.dateRangeFilter?.etdTo) edgeParams.set("etdTo", args.dateRangeFilter.etdTo);

  const result = await authFetch(
    `${EDGE_FUNCTION_SLUGS.shipmentsList.operatorOverview}?${edgeParams}`,
    { method: "GET" },
  );
  if ("error" in result) throw new Error(result.error);
  let parsed: { rows: ShipmentOverviewRow[]; totalCount: number; error?: string } = {
    rows: [],
    totalCount: 0,
  };
  try {
    parsed = result.text ? JSON.parse(result.text) : parsed;
  } catch {
    throw new Error("Invalid response from list-operator-shipments");
  }
  if (!result.res.ok) {
    throw new Error(parsed.error ?? result.res.statusText);
  }
  return { rows: parsed.rows ?? [], totalCount: parsed.totalCount ?? 0 };
}

export type DocumentQueueFilter =
  | "all"
  | "pending_drafts"
  | "awaiting_review"
  | "approved"
  | "rejected"
  | "originals_sent";

export type DocumentQueueRow = {
  id: string;
  order_number: string;
  customer_name: string | null;
  workflow_status: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  updated_at: string;
};

export async function loadDocumentQueuePageBrowser(args: {
  organizationId: string;
  scope: OperatorShipmentScope;
  workflowFilter: DocumentQueueFilter;
  search: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: DocumentQueueRow[]; totalCount: number }> {
  const params = new URLSearchParams({
    organization_id: args.organizationId,
    page: String(args.page),
    pageSize: String(args.pageSize),
    scope: args.scope,
    workflowFilter: args.workflowFilter,
    search: args.search,
  });
  return parseEdgeGetJson<{ rows: DocumentQueueRow[]; totalCount: number }>(
    `${EDGE_FUNCTION_SLUGS.shipmentsList.documentQueue}?${params}`,
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
  return loadOperatorTrackingRequestsViaEdge(args);
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
  const params = new URLSearchParams({
    organization_id: organizationId,
    limit: String(limit),
  });
  const { rows } = await parseEdgeGetJson<{ rows: ShipmentPickRow[] }>(
    `${EDGE_FUNCTION_SLUGS.shipments.pickRows}?${params}`,
  );
  return rows ?? [];
}

export async function createShipment(
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

export async function updateShipment(
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

export async function deleteShipment(
  body: DeleteShipmentBody,
): Promise<{ ok: true; data: DeleteShipmentResponse } | { ok: false; status: number; error: string }> {
  try {
    const r = await authFetch(EDGE_FUNCTION_SLUGS.shipments.delete, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if ("error" in r) return { ok: false, status: r.status, error: r.error };
    const parsed = parseEdgeJson<DeleteShipmentResponse & { error?: string }>(r);
    if (!r.res.ok) {
      return { ok: false, status: r.res.status, error: parsed?.error ?? r.res.statusText };
    }
    if (!parsed?.shipment_id) {
      return { ok: false, status: 500, error: "Invalid response" };
    }
    return { ok: true, data: parsed };
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
