import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShipmentPortalPayload } from "@shared/dto/shipment.dto";
import type { AcceptCustomerInviteResponse } from "@shared/dto/customer-access.dto";
import type { ServiceResult } from "@shared/dto/common.dto";
import type { LookupBolContainersResponse } from "@shared/dto/tracking.dto";
import { createClient } from "@/lib/supabase/client";
import { profileDisplayName } from "@/utils/author-display-name";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentParticipant,
  TrackingRequest,
} from "@/types/database";
import {
  fetchOperatorTrackingRequestsPage,
  type OperatorRequestScope,
  type OperatorRequestSortColumn,
  type SortDirection as RequestSortDirection,
} from "@/services/tracking.service";
import { fetchWorkspaceQuickSearch } from "@/services/workspace.service";

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

function sanitizeIlikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
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
  "reference",
  "bill_of_lading",
] as const;

export type OperatorShipmentSortColumn = (typeof OPERATOR_SHIPMENT_SORT_COLUMNS)[number];

export function normalizeOperatorShipmentSortColumn(raw: string | null): OperatorShipmentSortColumn {
  if (raw && (OPERATOR_SHIPMENT_SORT_COLUMNS as readonly string[]).includes(raw)) {
    return raw as OperatorShipmentSortColumn;
  }
  return "last_sync_at";
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
  reference: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  /** Shipment owner (`shipments.created_by`). */
  owner_user_id: string | null;
  /** Primary operator (`shipments.assignee_user_id`). */
  assignee_user_id: string | null;
  tracking_requests: ShipmentOverviewTrackingRow[] | ShipmentOverviewTrackingRow | null;
};

type RpcOverviewRow = {
  total_count: number | string;
  id: string;
  organization_id: string;
  reference: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tracking_requests: unknown;
};

function pickTrackingRows(
  raw: ShipmentOverviewRow["tracking_requests"],
): ShipmentOverviewTrackingRow[] {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function parseTrackingRequestsJson(raw: unknown): ShipmentOverviewTrackingRow[] {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return [];
  return raw as ShipmentOverviewTrackingRow[];
}

function toOverviewRow(r: RpcOverviewRow): ShipmentOverviewRow {
  return {
    id: r.id,
    organization_id: r.organization_id,
    reference: r.reference,
    bill_of_lading: r.bill_of_lading,
    shipping_line: r.shipping_line,
    shipment_group_id: r.shipment_group_id,
    created_at: r.created_at,
    owner_user_id: r.owner_user_id,
    assignee_user_id: r.assignee_user_id,
    tracking_requests: parseTrackingRequestsJson(r.tracking_requests),
  };
}

/**
 * Server-side paged shipment overview (Postgres RPC: operator_shipments_overview_page).
 */
export async function fetchOperatorShipmentsOverviewPage(
  supabase: SupabaseClient,
  args: {
    organizationId: string;
    userId: string | null;
    scope: OperatorShipmentScope;
    search: string;
    sortColumn: OperatorShipmentSortColumn;
    sortDirection: SortDirection;
    page: number;
    pageSize: number;
  },
): Promise<{ rows: ShipmentOverviewRow[]; totalCount: number }> {
  const {
    organizationId,
    userId,
    scope,
    search,
    sortColumn,
    sortDirection,
    page,
    pageSize,
  } = args;

  const offset = Math.max(0, page) * pageSize;

  const { data, error } = await supabase.rpc("operator_shipments_overview_page", {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_scope: scope,
    p_search: search.trim(),
    p_sort_column: sortColumn,
    p_sort_asc: sortDirection === "asc",
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) throw new Error(error.message);

  const rawRows = (data as RpcOverviewRow[] | null) ?? [];
  if (rawRows.length === 0) {
    return { rows: [], totalCount: 0 };
  }

  const totalCount = Number(rawRows[0]!.total_count);
  const rows = rawRows.map(toOverviewRow);

  return { rows, totalCount: Number.isFinite(totalCount) ? totalCount : 0 };
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
  "reference",
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
  reference: string;
  container_number: string;
  status: string;
  last_sync_at: string | null;
  updated_at: string;
  created_at: string;
  containers: NestedContainer | NestedContainer[] | null;
};

type AccessShipmentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  shipment_id: string;
  shipments:
    | {
        id: string;
        reference: string;
        bill_of_lading: string | null;
        shipping_line: string | null;
        updated_at: string;
        containers?: NestedContainer | NestedContainer[] | null;
      }
    | {
        id: string;
        reference: string;
        bill_of_lading: string | null;
        shipping_line: string | null;
        updated_at: string;
        containers?: NestedContainer | NestedContainer[] | null;
      }[]
    | null;
};

function pickTrStatus(c: NestedContainer | null | undefined): string | null {
  if (!c?.tracking_requests) return null;
  const tr = Array.isArray(c.tracking_requests) ? c.tracking_requests[0] : c.tracking_requests;
  return (tr?.status as string | null) ?? null;
}

/**
 * Paged list of shipments granted to the signed-in importer (`shipment_customer_access`).
 */
export async function fetchImporterGrantedShipmentsPage(
  supabase: SupabaseClient,
  args: {
    userId: string;
    page: number;
    pageSize: number;
    sortColumn: ImporterGrantedShipmentSortColumn;
    sortDirection: SortDirection;
    search: string;
  },
): Promise<{ rows: ImporterGrantedShipmentRow[]; totalCount: number }> {
  const { userId, page, pageSize, sortColumn, sortDirection, search } = args;

  let q = supabase
    .from("shipment_customer_access")
    .select(
      `
      id,
      created_at,
      updated_at,
      shipment_id,
      shipments!inner (
        id,
        reference,
        bill_of_lading,
        shipping_line,
        updated_at,
        containers (
          id,
          container_number,
          status,
          last_synced_at,
          location,
          tracking_requests ( status, last_sync_at )
        )
      )
    `,
      { count: "exact" },
    )
    .eq("customer_user_id", userId)
    .is("revoked_at", null);

  const term = search.trim();
  if (term) {
    const s = sanitizeIlikeTerm(term);
    q = q.or(`reference.ilike.%${s}%,bill_of_lading.ilike.%${s}%`, {
      referencedTable: "shipments",
    });
  }

  const sortRef =
    sortColumn === "reference"
      ? { column: "reference" as const, foreignTable: "shipments" as const }
      : sortColumn === "updated_at"
        ? { column: "updated_at" as const, foreignTable: "shipments" as const }
        : { column: "created_at" as const, foreignTable: undefined };

  if (sortRef.foreignTable) {
    q = q.order(sortRef.column, {
      ascending: sortDirection === "asc",
      referencedTable: sortRef.foreignTable,
    });
  } else {
    q = q.order(sortRef.column, { ascending: sortDirection === "asc" });
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await q.range(from, to);
  if (error) throw new Error(error.message);

  const raw = (data ?? []) as AccessShipmentRow[];
  const rows: ImporterGrantedShipmentRow[] = [];
  for (const row of raw) {
    const ship = row.shipments;
    const s = Array.isArray(ship) ? ship[0] : ship;
    if (!s?.id) continue;
    const contRaw = s.containers;
    const contList: NestedContainer[] = !contRaw
      ? []
      : Array.isArray(contRaw)
        ? contRaw
        : [contRaw];
    contList.sort((a, b) =>
      String(a.container_number ?? "").localeCompare(String(b.container_number ?? "")),
    );
    const first = contList[0] ?? null;
    const numbers = contList
      .map((c) => c.container_number?.trim())
      .filter(Boolean) as string[];
    const label =
      numbers.length === 0
        ? s.reference.trim() || s.id.slice(0, 8)
        : numbers.length === 1
          ? numbers[0]!
          : `${numbers.length} containers`;
    const trStatus = pickTrStatus(first);
    const syncAt =
      first?.last_synced_at ??
      (Array.isArray(first?.tracking_requests)
        ? first?.tracking_requests[0]?.last_sync_at
        : first?.tracking_requests?.last_sync_at) ??
      null;

    rows.push({
      id: s.id,
      access_grant_id: row.id,
      reference: s.reference,
      container_number: label,
      status: trStatus ?? "pending",
      last_sync_at: syncAt,
      updated_at: s.updated_at ?? row.updated_at,
      created_at: row.created_at,
      containers: first,
    });
  }

  return { rows, totalCount: count ?? 0 };
}

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
};

export async function fetchShipmentAccessTabSnapshot(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<ShipmentAccessTabSnapshot> {
  const supabase = createClient();
  const [
    { data: ship },
    { data: parts },
    { data: orgMemberRows },
    { data: accessRows },
    { data: invRows },
  ] = await Promise.all([
    supabase
      .from("shipments")
      .select("assignee_user_id")
      .eq("id", input.shipmentId)
      .eq("organization_id", input.organizationId)
      .maybeSingle(),
    supabase
      .from("shipment_participants")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .order("created_at", { ascending: true }),
    supabase.from("organization_members").select("user_id").eq("organization_id", input.organizationId),
    supabase
      .from("shipment_customer_access")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("customer_invites")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const assigneeUserId = (ship?.assignee_user_id as string | null) ?? null;
  const participantRows = (parts as ShipmentParticipant[]) ?? [];
  const customerAccessRows = (accessRows as ShipmentCustomerAccess[]) ?? [];
  const pendingInvites = (invRows as CustomerInvite[]) ?? [];

  const imagePathByUser: Record<string, string | null> = {};
  const orgUserIds = [...new Set((orgMemberRows ?? []).map((m) => m.user_id as string))];
  let orgPeers: { id: string; label: string }[] = [];

  if (orgUserIds.length > 0) {
    const { data: peerProfs } = await supabase
      .from("profiles")
      .select("id, email, full_name, profile_image_path")
      .in("id", orgUserIds);
    orgPeers =
      (peerProfs ?? []).map((p) => ({
        id: p.id as string,
        label: profileDisplayName({
          full_name: p.full_name as string | null,
          email: p.email as string | null,
        }),
      })) ?? [];
    orgPeers.sort((a, b) => a.label.localeCompare(b.label));
    for (const p of peerProfs ?? []) {
      const uid = p.id as string;
      const path = p.profile_image_path as string | null | undefined;
      imagePathByUser[uid] = path?.trim() ? path : null;
    }
  }

  const customerIds = customerAccessRows.map((a) => a.customer_user_id);
  const participantIds = participantRows.map((p) => p.user_id);
  const profileIds = [...new Set([...customerIds, ...participantIds, ...(assigneeUserId ? [assigneeUserId] : [])])];
  const messageAuthorByUserId: Record<string, string> = {};
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      messageAuthorByUserId[p.id as string] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
    }
  }

  return {
    assigneeUserId,
    participantRows,
    orgPeers,
    profileImagePathByUserId: imagePathByUser,
    customerAccessRows,
    pendingInvites,
    messageAuthorByUserId,
  };
}

export async function updateShipmentAssignee(input: {
  shipmentId: string;
  organizationId: string;
  assigneeUserId: string | null;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shipments")
    .update({ assignee_user_id: input.assigneeUserId })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
}

export async function insertShipmentParticipant(input: {
  shipmentId: string;
  userId: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shipment_participants").insert({
    shipment_id: input.shipmentId,
    user_id: input.userId,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function deleteShipmentParticipantRow(participantRowId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shipment_participants").delete().eq("id", participantRowId);
  if (error) throw new Error(error.message);
}

export async function revokeCustomerInviteRow(inviteId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("customer_invites").update({ status: "revoked" }).eq("id", inviteId);
  if (error) throw new Error(error.message);
}

export async function revokeShipmentCustomerAccessRow(accessId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Shipment Customer Access Settings                                  */
/* ------------------------------------------------------------------ */

export async function updateShipmentCustomerAccessSettings(input: {
  accessId: string;
  visibilitySettings: Record<string, boolean>;
  operatorOverrides: Record<string, string>;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({
      visibility_settings: input.visibilitySettings,
      operator_overrides: input.operatorOverrides,
    })
    .eq("id", input.accessId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Shipment Workspace Row                                             */
/* ------------------------------------------------------------------ */

export type ShipmentWorkspaceRow = {
  id: string;
  organization_id: string;
  reference: string;
  bill_of_lading: string | null;
  shipping_line: string | null;
  shipment_group_id: string | null;
  created_at: string;
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tracking_requests: ShipmentOverviewTrackingRow[];
};

export async function fetchShipmentWorkspaceRow(input: {
  shipmentId: string;
  organizationId: string;
}): Promise<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }> {
  const supabase = createClient();
  const { data, error: qErr } = await supabase
    .from("shipments")
    .select(
      `
          id,
          organization_id,
          reference,
          bill_of_lading,
          shipping_line,
          shipment_group_id,
          created_at,
          created_by,
          assignee_user_id,
          containers (
            id,
            container_number,
            tracking_requests (
              id,
              container_id,
              container_number,
              normalized_number,
              status,
              last_sync_at,
              created_at,
              error_message,
              source_bill_of_lading
            )
          )
        `,
    )
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (qErr) return { ok: false, error: qErr.message };
  if (!data) return { ok: false, error: "Shipment not found in this organization." };

  const raw = data as {
    id: string;
    organization_id: string;
    reference: string;
    bill_of_lading: string | null;
    shipping_line: string | null;
    shipment_group_id: string | null;
    created_at: string;
    created_by: string | null;
    assignee_user_id: string | null;
    containers?: Array<{
      id: string;
      container_number: string;
      tracking_requests?: ShipmentOverviewTrackingRow | ShipmentOverviewTrackingRow[] | null;
    }> | null;
  };
  const lines: ShipmentOverviewTrackingRow[] = [];
  for (const c of raw.containers ?? []) {
    const trs = c.tracking_requests;
    if (Array.isArray(trs)) lines.push(...trs);
    else if (trs) lines.push(trs);
  }

  return {
    ok: true,
    row: {
      id: raw.id,
      organization_id: raw.organization_id,
      reference: raw.reference,
      bill_of_lading: raw.bill_of_lading,
      shipping_line: raw.shipping_line,
      shipment_group_id: raw.shipment_group_id,
      created_at: raw.created_at,
      owner_user_id: raw.created_by,
      assignee_user_id: raw.assignee_user_id ?? null,
      tracking_requests: lines,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Edge Functions — Shipment Portal                                   */
/* ------------------------------------------------------------------ */

/** Shipment portal payload (operator, assignee/participant, or importer grant). */
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
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
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
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { rows: [], totalCount: 0 };
  return fetchImporterGrantedShipmentsPage(supabase, { userId, ...args });
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
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  return fetchOperatorShipmentsOverviewPage(supabase, {
    ...args,
    userId: u.user?.id ?? null,
  });
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
  const supabase = createClient();
  const { data: u } = await supabase.auth.getUser();
  return fetchOperatorTrackingRequestsPage(supabase, {
    ...args,
    userId: u.user?.id ?? null,
  });
}

export async function loadWorkspaceQuickSearchBrowser(args: Parameters<typeof fetchWorkspaceQuickSearch>[1]) {
  const supabase = createClient();
  return fetchWorkspaceQuickSearch(supabase, args);
}

/* ------------------------------------------------------------------ */
/*  Shipment Pick                                                      */
/* ------------------------------------------------------------------ */

export type ShipmentPickRow = {
  id: string;
  reference: string;
  created_at: string;
};

export async function fetchOrganizationShipmentsForTrackingPick(
  organizationId: string,
  limit = 200,
): Promise<ShipmentPickRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("id, reference, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ShipmentPickRow[]) ?? [];
}
