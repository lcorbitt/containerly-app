import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { profileDisplayName } from "@/utils/author-display-name";
import { isSuperadminRole } from "@/utils/profile-role";
import { normalizeShipmentTagList } from "@/utils/shipment-tags";
import {
  buildShipmentContextSummary,
  buildShipmentInsightCards,
  computeShipmentMetrics,
} from "@/utils/shipment-metrics";
import {
  OPERATOR_SHIPMENT_SORT_COLUMNS,
  normalizeOperatorShipmentSortColumn,
  type OperatorShipmentSortColumn,
} from "@/utils/operator-shipment-sort";
import type { ImporterGrantedShipmentSortColumn } from "@/utils/importer-shipment-sort";

export {
  IMPORTER_GRANTED_SHIPMENT_SORT_COLUMNS,
  normalizeImporterGrantedShipmentSortColumn,
  type ImporterGrantedShipmentSortColumn,
} from "@/utils/importer-shipment-sort";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type {
  ShipmentContextSummary,
  ShipmentInsightCard,
  ShipmentMetricsSummary,
  ShipmentRootCause,
} from "@shared/dto/performance.dto";
import type { PublicTimelineEvent } from "@/types/public-report";
import type {
  CustomerInvite,
  ShipmentCustomerAccess,
  ShipmentCustomerAccessRequest,
  ShipmentParticipant,
  TrackingRequest,
} from "@/types/database";

function sanitizeIlikeTerm(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

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
  tags: string[];
  tracking_requests: ShipmentOverviewTrackingRow[] | ShipmentOverviewTrackingRow | null;
};

type RpcOverviewRow = {
  total_count: number | string;
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
  owner_user_id: string | null;
  assignee_user_id: string | null;
  tags: string[] | null;
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
    order_number: r.order_number,
    carrier_booking_number: r.carrier_booking_number,
    container_number: r.container_number,
    customer_name: r.customer_name,
    bill_of_lading: r.bill_of_lading,
    shipping_line: r.shipping_line,
    shipment_group_id: r.shipment_group_id,
    workflow_status: r.workflow_status,
    port_of_loading: r.port_of_loading,
    port_of_destination: r.port_of_destination,
    estimated_arrival_at: r.estimated_arrival_at,
    created_at: r.created_at,
    owner_user_id: r.owner_user_id,
    assignee_user_id: r.assignee_user_id,
    tags: Array.isArray(r.tags) ? r.tags : [],
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
    tagFilter?: string | null;
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
    tagFilter,
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
    p_tag_filter: tagFilter?.trim() || null,
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

/* ------------------------------------------------------------------ */
/*  Importer Granted Shipments                                         */
/* ------------------------------------------------------------------ */

/** One grant row: shipment-scoped importer access (ops overview fields + org). */
export type ImporterGrantedShipmentRow = {
  /** Shipment id — use for `/shipments/hub/[id]` and `get-shipment`. */
  id: string;
  access_grant_id: string;
  organization_id: string;
  organization_name: string;
  order_number: string;
  customer_name: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  workflow_status: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
};

type RpcImporterOverviewRow = {
  total_count: number | string;
  access_grant_id: string;
  id: string;
  organization_id: string;
  organization_name: string;
  order_number: string;
  customer_name: string | null;
  port_of_loading: string | null;
  port_of_destination: string | null;
  workflow_status: string | null;
  estimated_arrival_at: string | null;
  created_at: string;
};

function toImporterOverviewRow(r: RpcImporterOverviewRow): ImporterGrantedShipmentRow {
  return {
    id: r.id,
    access_grant_id: r.access_grant_id,
    organization_id: r.organization_id,
    organization_name: r.organization_name?.trim() || "—",
    order_number: r.order_number,
    customer_name: r.customer_name,
    port_of_loading: r.port_of_loading,
    port_of_destination: r.port_of_destination,
    workflow_status: r.workflow_status,
    estimated_arrival_at: r.estimated_arrival_at,
    created_at: r.created_at,
  };
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
  const offset = Math.max(0, page) * pageSize;

  const { data, error } = await supabase.rpc("importer_granted_shipments_overview_page", {
    p_customer_user_id: userId,
    p_search: search.trim(),
    p_sort_column: sortColumn,
    p_sort_asc: sortDirection === "asc",
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) throw new Error(error.message);

  const rawRows = (data as RpcImporterOverviewRow[] | null) ?? [];
  if (rawRows.length === 0) {
    return { rows: [], totalCount: 0 };
  }

  const totalCount = Number(rawRows[0]!.total_count);
  const rows = rawRows.map(toImporterOverviewRow);

  return { rows, totalCount: Number.isFinite(totalCount) ? totalCount : 0 };
}
export type ShipmentAccessTabSnapshot = {
  assigneeUserId: string | null;
  participantRows: ShipmentParticipant[];
  orgPeers: { id: string; label: string }[];
  profileImagePathByUserId: Record<string, string | null>;
  customerAccessRows: ShipmentCustomerAccess[];
  pendingInvites: CustomerInvite[];
  pendingAccessRequests: ShipmentCustomerAccessRequest[];
  messageAuthorByUserId: Record<string, string>;
  tags: string[];
  orgTagSuggestions: string[];
  emailNotificationsSubscribed: boolean;
};

export async function fetchShipmentAccessTabSnapshot(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    currentUserId: string;
  },
): Promise<ShipmentAccessTabSnapshot> {
  const [
    { data: ship },
    { data: parts },
    { data: orgMemberRows },
    { data: accessRows },
    { data: invRows },
    { data: accessReqRows },
    { data: orgTagRows },
    { data: notificationSub },
  ] = await Promise.all([
    supabase
      .from("shipments")
      .select("assignee_user_id, tags")
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
    supabase
      .from("shipment_customer_access_requests")
      .select("*")
      .eq("shipment_id", input.shipmentId)
      .eq("status", "pending")
      .order("requested_at", { ascending: false }),
    supabase.from("shipments").select("tags").eq("organization_id", input.organizationId),
    supabase
      .from("shipment_notification_subscriptions")
      .select("id")
      .eq("shipment_id", input.shipmentId)
      .eq("user_id", input.currentUserId)
      .maybeSingle(),
  ]);

  const assigneeUserId = (ship?.assignee_user_id as string | null) ?? null;
  const tags = normalizeShipmentTagList(((ship?.tags as string[] | null) ?? []) as string[]);
  const participantRows = (parts as ShipmentParticipant[]) ?? [];
  const customerAccessRows = (accessRows as ShipmentCustomerAccess[]) ?? [];
  const pendingInvites = (invRows as CustomerInvite[]) ?? [];
  const pendingAccessRequests = (accessReqRows as ShipmentCustomerAccessRequest[]) ?? [];

  const orgTagSuggestionSet = new Set<string>();
  for (const row of orgTagRows ?? []) {
    for (const tag of (row.tags as string[] | null) ?? []) {
      const normalized = normalizeShipmentTagList([tag])[0];
      if (normalized) orgTagSuggestionSet.add(normalized);
    }
  }
  const orgTagSuggestions = [...orgTagSuggestionSet].sort((a, b) => a.localeCompare(b));
  const emailNotificationsSubscribed = Boolean(notificationSub?.id);

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
    pendingAccessRequests,
    messageAuthorByUserId,
    tags,
    orgTagSuggestions,
    emailNotificationsSubscribed,
  };
}
export async function updateShipmentNotificationSubscriptionQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    userId: string;
    subscribed: boolean;
  },
): Promise<boolean> {
  if (input.subscribed) {
    const { error } = await supabase.from("shipment_notification_subscriptions").insert({
      organization_id: input.organizationId,
      shipment_id: input.shipmentId,
      user_id: input.userId,
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    return true;
  }

  const { error } = await supabase
    .from("shipment_notification_subscriptions")
    .delete()
    .eq("shipment_id", input.shipmentId)
    .eq("user_id", input.userId);
  if (error) throw new Error(error.message);
  return false;
}
export async function updateShipmentTagsQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    tags: string[];
  },
): Promise<string[]> {
  const normalized = normalizeShipmentTagList(input.tags);
  const { error } = await supabase
    .from("shipments")
    .update({ tags: normalized })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
  return normalized;
}

export async function updateShipmentRootCauseQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    rootCause: ShipmentRootCause | null;
  },
): Promise<ShipmentRootCause | null> {
  const { error } = await supabase
    .from("shipments")
    .update({ root_cause: input.rootCause })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
  return input.rootCause;
}

export async function fetchShipmentAssigneeQuery(
  supabase: SupabaseClient,
  shipmentId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("shipments")
    .select("assignee_user_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.assignee_user_id as string | null | undefined) ?? null;
}

export async function updateShipmentAssigneeQuery(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
    assigneeUserId: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("shipments")
    .update({ assignee_user_id: input.assigneeUserId })
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (error) throw new Error(error.message);
}

export async function fetchShipmentParticipantRowQuery(
  supabase: SupabaseClient,
  participantRowId: string,
): Promise<{ shipment_id: string; user_id: string } | null> {
  const { data, error } = await supabase
    .from("shipment_participants")
    .select("shipment_id, user_id")
    .eq("id", participantRowId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.shipment_id || !data?.user_id) return null;
  return {
    shipment_id: data.shipment_id as string,
    user_id: data.user_id as string,
  };
}

export async function insertShipmentParticipantQuery(
  supabase: SupabaseClient,
  input: { shipmentId: string; userId: string },
): Promise<void> {
  const { error } = await supabase.from("shipment_participants").insert({
    shipment_id: input.shipmentId,
    user_id: input.userId,
  });
  if (error && error.code !== "23505") throw new Error(error.message);
}

export async function deleteShipmentParticipantQuery(
  supabase: SupabaseClient,
  participantRowId: string,
): Promise<void> {
  const { error } = await supabase.from("shipment_participants").delete().eq("id", participantRowId);
  if (error) throw new Error(error.message);
}

export async function deleteShipmentForOrganizationQuery(
  supabase: SupabaseClient,
  input: { organizationId: string; shipmentId: string; userId: string },
): Promise<void> {
  const { data: existing, error: existingErr } = await supabase
    .from("shipments")
    .select("id")
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);
  if (!existing?.id) throw new Error("Shipment not found");

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", input.userId)
    .maybeSingle();
  if (profileErr) throw new Error(profileErr.message);

  if (!isSuperadminRole(profile?.role)) {
    const { data: membership, error: memErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.userId)
      .maybeSingle();
    if (memErr) throw new Error(memErr.message);
    if (membership?.role !== "admin") {
      throw new Error("Only organization admins can delete shipments");
    }
  }

  const { error: delErr } = await supabase
    .from("shipments")
    .delete()
    .eq("id", input.shipmentId)
    .eq("organization_id", input.organizationId);
  if (delErr) throw new Error(delErr.message);
}

export async function revokeCustomerInviteQuery(
  supabase: SupabaseClient,
  inviteId: string,
): Promise<void> {
  const { error } = await supabase.from("customer_invites").update({ status: "revoked" }).eq("id", inviteId);
  if (error) throw new Error(error.message);
}

export async function revokeShipmentCustomerAccessQuery(
  supabase: SupabaseClient,
  accessId: string,
): Promise<void> {
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", accessId);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Shipment Customer Access Settings                                  */
/* ------------------------------------------------------------------ */

export async function updateShipmentCustomerAccessSettingsQuery(
  supabase: SupabaseClient,
  input: {
    accessId: string;
    visibilitySettings: Record<string, boolean>;
    operatorOverrides: Record<string, string>;
  },
): Promise<void> {
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({
      visibility_settings: input.visibilitySettings,
      operator_overrides: input.operatorOverrides,
    })
    .eq("id", input.accessId);
  if (error) throw new Error(error.message);
}
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
  /** Primary container carrier-reported status (for default portal risk). */
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

export async function fetchShipmentWorkspaceRow(
  supabase: SupabaseClient,
  input: {
    shipmentId: string;
    organizationId: string;
  },
): Promise<{ ok: true; row: ShipmentWorkspaceRow } | { ok: false; error: string }> {
  const { data, error: qErr } = await supabase
    .from("shipments")
    .select(
      `
          id,
          organization_id,
          order_number,
          carrier_booking_number,
          container_number,
          bill_of_lading,
          shipping_line,
          shipment_group_id,
          created_at,
          created_by,
          assignee_user_id,
          customer_name,
          country,
          port_of_loading,
          port_of_destination,
          estimated_departure_at,
          estimated_arrival_at,
          freight_booking_carrier,
          vessel,
          voyage,
          health_certificate_no,
          trade_terms,
          workflow_status,
          physical_mail_tracking_number,
          risk_level,
          risk_message,
          tags,
          root_cause,
          containers (
            id,
            container_number,
            status,
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
    order_number: string;
    carrier_booking_number: string;
    container_number: string;
    bill_of_lading: string | null;
    shipping_line: string | null;
    shipment_group_id: string | null;
    created_at: string;
    created_by: string | null;
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
    tags?: string[] | null;
    root_cause?: string | null;
    containers?: Array<{
      id: string;
      container_number: string;
      status: string | null;
      tracking_requests?: ShipmentOverviewTrackingRow | ShipmentOverviewTrackingRow[] | null;
    }> | null;
  };
  const containers = raw.containers ?? [];
  const primaryCarrierStatus = containers[0]?.status ?? null;
  const containerIds = containers.map((c) => c.id);

  const lines: ShipmentOverviewTrackingRow[] = [];
  for (const c of containers) {
    const trs = c.tracking_requests;
    if (Array.isArray(trs)) lines.push(...trs);
    else if (trs) lines.push(trs);
  }

  const [
    creatorProfileResult,
    activityResult,
    trackingEventsResult,
    messagesResult,
    orgMessageStatsResult,
  ] = await Promise.all([
    raw.created_by
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", raw.created_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("shipment_activity_events")
      .select("id, event_type, body, actor_kind, occurred_at, metadata")
      .eq("shipment_id", input.shipmentId)
      .order("occurred_at", { ascending: true }),
    containerIds.length > 0
      ? supabase
          .from("tracking_events")
          .select(
            "id, event_type, status, location, occurred_at, created_at, container_id, tracking_request_id, raw_payload",
          )
          .in("container_id", containerIds)
          .order("occurred_at", { ascending: true })
          .limit(200)
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    supabase
      .from("report_messages")
      .select("shipment_id, container_id, author_kind, created_at, is_internal, body")
      .eq("shipment_id", input.shipmentId)
      .is("container_id", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_messages")
      .select("shipment_id, container_id, author_kind, created_at, is_internal")
      .eq("organization_id", input.organizationId)
      .is("container_id", null)
      .eq("is_internal", false)
      .limit(5000),
  ]);

  if (activityResult.error) return { ok: false, error: activityResult.error.message };

  let creatorDisplayName: string | null = null;
  const creatorProfile = creatorProfileResult.data;
  if (creatorProfile) {
    creatorDisplayName = profileDisplayName({
      full_name: creatorProfile.full_name as string | null,
      email: creatorProfile.email as string | null,
    });
  }

  const carrierTimeline = ((trackingEventsResult.data ?? []) as PublicTimelineEvent[]) ?? [];

  const shipmentMessages = (messagesResult.data ?? []) as Array<{
    shipment_id: string | null;
    container_id: string | null;
    author_kind: string;
    created_at: string;
    is_internal: boolean;
    body: string;
  }>;

  const metrics = computeShipmentMetrics({
    shipmentId: input.shipmentId,
    workflowStatus: raw.workflow_status,
    workflowStatusSince: raw.created_at,
    messages: shipmentMessages,
  });

  const orgMessages = (orgMessageStatsResult.data ?? []) as Array<{ shipment_id: string | null }>;
  const orgShipmentMessageCounts = new Map<string, number>();
  for (const msg of orgMessages) {
    const sid = msg.shipment_id;
    if (!sid) continue;
    orgShipmentMessageCounts.set(sid, (orgShipmentMessageCounts.get(sid) ?? 0) + 1);
  }
  const orgAvgMessages =
    orgShipmentMessageCounts.size > 0
      ? [...orgShipmentMessageCounts.values()].reduce((a, b) => a + b, 0) /
        orgShipmentMessageCounts.size
      : 0;

  const tags = normalizeShipmentTagList(raw.tags ?? []);
  const rootCause = (raw.root_cause as ShipmentRootCause | null) ?? null;

  const context = buildShipmentContextSummary({
    tags,
    risk_level: raw.risk_level,
    risk_message: raw.risk_message,
    triage_bucket_key: null,
    metrics,
  });

  const insightCards = buildShipmentInsightCards({
    metrics,
    orgAvgMessages,
    orgMedianResponseHours: null,
    triageBucketKey: null,
  });

  return {
    ok: true,
    row: {
      id: raw.id,
      organization_id: raw.organization_id,
      order_number: raw.order_number,
      carrier_booking_number: raw.carrier_booking_number,
      container_number: raw.container_number,
      bill_of_lading: raw.bill_of_lading,
      shipping_line: raw.shipping_line,
      shipment_group_id: raw.shipment_group_id,
      created_at: raw.created_at,
      owner_user_id: raw.created_by,
      creator_display_name: creatorDisplayName,
      assignee_user_id: raw.assignee_user_id ?? null,
      customer_name: raw.customer_name,
      country: raw.country,
      port_of_loading: raw.port_of_loading,
      port_of_destination: raw.port_of_destination,
      estimated_departure_at: raw.estimated_departure_at,
      estimated_arrival_at: raw.estimated_arrival_at,
      freight_booking_carrier: raw.freight_booking_carrier,
      vessel: raw.vessel,
      voyage: raw.voyage,
      health_certificate_no: raw.health_certificate_no,
      trade_terms: raw.trade_terms,
      workflow_status: raw.workflow_status,
      physical_mail_tracking_number: raw.physical_mail_tracking_number,
      risk_level: raw.risk_level,
      risk_message: raw.risk_message,
      primary_carrier_status: primaryCarrierStatus,
      tags,
      root_cause: rootCause,
      carrier_timeline: carrierTimeline,
      metrics,
      context,
      insight_cards: insightCards,
      tracking_requests: lines,
      activity_events: (activityResult.data ?? []).map((row) => ({
        id: row.id as string,
        event_type: row.event_type as string,
        body: row.body as string,
        actor_kind: row.actor_kind as string,
        occurred_at: row.occurred_at as string,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
      })),
    },
  };
}

export type ShipmentPickRow = {
  id: string;
  order_number: string;
  created_at: string;
};

export async function fetchShipmentPickRows(
  supabase: SupabaseClient,
  organizationId: string,
  limit: number,
): Promise<ShipmentPickRow[]> {
  const { data, error } = await supabase
    .from("shipments")
    .select("id, order_number, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as ShipmentPickRow[]) ?? [];
}
