import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { listAlertsForContainers } from "@models/alerts";
import { listContainersForShipment } from "@models/containers";
import { fetchOrganizationForPortal } from "@models/organizations";
import { fetchProfileEmailsByUserIds, fetchProfileImagePathsByUserIds } from "@models/profiles";
import {
  queryReportMessagesForContainers,
  queryReportMessagesForShipment,
} from "@models/report_messages";
import { fetchSharedReportById } from "@models/shared_reports";
import { listShipmentActivityEvents } from "@models/shipment_activity_events";
import { listShipmentLinesForShipment } from "@models/shipment_lines";
import { fetchShipmentPortalHeader } from "@models/shipments";
import { listTrackingEventsForContainers } from "@models/tracking_events";
import { listTrackingRequestsByContainerIds } from "@models/tracking_requests";
import {
  listWorkspaceAttachmentsForContainers,
  listWorkspaceAttachmentsForShipment,
} from "@models/workspace_attachments";
import { headlineFromSummary, resolveShipmentRiskLevel, riskFromStatus } from "../insights.ts";

/** Visibility for importer portal + operator preview (per `shipment_customer_access.visibility_settings`). */
export type ShareSettings = {
  include_raw_external?: boolean;
  include_alerts?: boolean;
  /** Default false — B/L is sensitive. */
  show_bill_of_lading?: boolean;
  /** AIS / vessel enrichment block. Default true when unset. */
  show_ais_enrichment?: boolean;
  /** Carrier milestone timeline. Default true when unset. */
  show_carrier_timeline?: boolean;
};

export const DEFAULT_CUSTOMER_VISIBILITY: ShareSettings = {
  include_raw_external: false,
  include_alerts: true,
  show_bill_of_lading: false,
  show_ais_enrichment: true,
  show_carrier_timeline: true,
};

/** Org members viewing the shipment portal (full detail, internal thread). */
export const OPERATOR_SHIPMENT_PORTAL_VISIBILITY: ShareSettings = {
  include_raw_external: true,
  include_alerts: true,
  show_bill_of_lading: true,
  show_ais_enrichment: true,
  show_carrier_timeline: true,
};

export type ShipmentPortalReportMeta = {
  id: string;
  title: string | null;
  created_at: string;
  expires_at: string | null;
};

function applyOperatorOverrides(
  summary: Record<string, unknown>,
  overrides: Record<string, unknown>,
): void {
  if (!overrides || typeof overrides !== "object") return;
  const o = overrides as Record<string, unknown>;
  if (o.display_status_label != null) summary.status = o.display_status_label;
  if (o.display_last_location != null) summary.last_known_location = o.display_last_location;
  if (o.display_eta != null) {
    const ctx = (summary.shipment_context ?? {}) as Record<string, unknown>;
    summary.shipment_context = { ...ctx, customer_display_eta: o.display_eta };
  }
  if (o.customer_note != null) summary.customer_note = o.customer_note;
}

function mergeVisibilitySettings(raw: Record<string, unknown> | null | undefined): ShareSettings {
  return { ...DEFAULT_CUSTOMER_VISIBILITY, ...(raw ?? {}) } as ShareSettings;
}

function parseLooseDate(s: string | null | undefined): Date | null {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (!t) return null;
  const iso = t.includes("T") ? t : t.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/, "$1T$2:00");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function etaDivergenceHours(
  carrierEtaRaw: unknown,
  aisEtaRaw: unknown,
): number | null {
  const c = parseLooseDate(carrierRawToString(carrierEtaRaw));
  const a = parseLooseDate(typeof aisEtaRaw === "string" ? aisEtaRaw : null);
  if (!c || !a) return null;
  return Math.round((a.getTime() - c.getTime()) / 3600000);
}

function carrierRawToString(v: unknown): string | null {
  if (v == null) return null;
  return typeof v === "string" ? v : String(v);
}

function applyVisibilityToSummary(summary: Record<string, unknown>, settings: ShareSettings): void {
  if (settings.show_bill_of_lading === true) return;
  const ctx = summary.shipment_context;
  if (!ctx || typeof ctx !== "object" || Array.isArray(ctx)) return;
  const c = { ...(ctx as Record<string, unknown>) };
  delete c.bill_of_lading;
  summary.shipment_context = c;
}

function aggregateWorkflowStatus(statuses: string[]): string {
  const order = ["failed", "pending", "syncing", "active", "completed"];
  let best = "completed";
  let bi = order.indexOf(best);
  for (const s of statuses) {
    const t = (s ?? "").toLowerCase();
    const i = order.indexOf(t);
    if (i >= 0 && i < bi) {
      bi = i;
      best = order[i] ?? best;
    }
  }
  return best;
}

/** Full shipment portal payload: all containers on the shipment (timeline, messages, documents, alerts). */
export async function buildShipmentPortalPayload(
  admin: SupabaseClient,
  shipmentId: string,
  visibility: ShareSettings,
  operatorOverrides: Record<string, unknown>,
  reportMeta: ShipmentPortalReportMeta,
  shipmentAccessMeta?: Record<string, unknown> | null,
  portalOptions?: { includeInternalMessages?: boolean },
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const settings = { ...DEFAULT_CUSTOMER_VISIBILITY, ...visibility };

  const includeRaw = settings.include_raw_external === true;
  const includeAlerts = settings.include_alerts !== false;
  const showTimeline = settings.show_carrier_timeline !== false;
  const showAis = settings.show_ais_enrichment !== false;

  const { data: shipment, error: shErr } = await fetchShipmentPortalHeader(admin, shipmentId);

  if (shErr || !shipment) {
    return { ok: false, status: 404, error: "Shipment not found" };
  }

  const { data: org } = await fetchOrganizationForPortal(admin, shipment.organization_id as string);

  const { data: containers } = await listContainersForShipment(admin, shipmentId);

  const containerList = containers ?? [];
  const containerIds = containerList.map((c) => c.id as string);

  const { data: lineRows } = await listShipmentLinesForShipment(admin, shipmentId);
  const { data: activityRows } = await listShipmentActivityEvents(admin, shipmentId);

  const numberByContainer: Record<string, string> = {};
  for (const c of containerList) {
    numberByContainer[c.id as string] = c.container_number as string;
  }

  const { data: trRows } = containerIds.length > 0
    ? await listTrackingRequestsByContainerIds(admin, containerIds)
    : { data: [] as Record<string, unknown>[] };

  const trByContainer: Record<string, { status: string; last_sync_at: string | null }> = {};
  for (const tr of trRows ?? []) {
    const cid = tr.container_id as string | null;
    if (!cid) continue;
    trByContainer[cid] = {
      status: tr.status as string,
      last_sync_at: tr.last_sync_at as string | null,
    };
  }

  const { data: events } = containerIds.length > 0
    ? await listTrackingEventsForContainers(admin, containerIds, 500)
    : { data: [] as Record<string, unknown>[] };

  const eventsDecorated = (events ?? []).map((e) => ({
    ...e,
    container_number: e.container_id ? numberByContainer[e.container_id as string] ?? null : null,
  }));

  let alerts: unknown[] | null = null;
  if (includeAlerts) {
    const { data: al } = await listAlertsForContainers(admin, containerIds, 50);
    alerts = (al ?? []).map((a) => ({
      ...a,
      container_number: a.container_id ? numberByContainer[a.container_id as string] ?? null : null,
    }));
  }

  const includeInternal = Boolean(portalOptions?.includeInternalMessages);
  const [{ data: msgContainer }, { data: msgShipment }] = await Promise.all([
    containerIds.length > 0
      ? queryReportMessagesForContainers(admin, containerIds, includeInternal)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    queryReportMessagesForShipment(admin, shipmentId, includeInternal),
  ]);
  const messages = [...(msgContainer ?? []), ...(msgShipment ?? [])].sort(
    (a, b) => Date.parse(String(a.created_at)) - Date.parse(String(b.created_at)),
  );

  const messagesDecorated = messages.map((m) => ({
    ...m,
    container_number: m.container_id ? numberByContainer[m.container_id as string] ?? null : null,
    scope: m.container_id ? "container" as const : "shipment" as const,
  }));

  const messageAuthorUserIds = [
    ...new Set(
      messagesDecorated
        .map((m) => m.author_user_id as string | null | undefined)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const [profileImagePathByUserId, profileEmailByUserId] = await Promise.all([
    fetchProfileImagePathsByUserIds(admin, messageAuthorUserIds),
    fetchProfileEmailsByUserIds(admin, messageAuthorUserIds),
  ]);

  const [{ data: attContainer }, { data: attShipment }] = await Promise.all([
    containerIds.length > 0
      ? listWorkspaceAttachmentsForContainers(admin, containerIds, 100)
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    listWorkspaceAttachmentsForShipment(admin, shipmentId, 50),
  ]);
  let attachmentRows = [...(attContainer ?? []), ...(attShipment ?? [])];
  if (!portalOptions?.includeInternalMessages) {
    attachmentRows = attachmentRows.filter((a) => {
      const row = a as { is_internal?: boolean; shipment_id?: string | null; container_id?: string | null };
      if (row.shipment_id && !row.container_id) return true;
      return row.is_internal === false;
    });
  }
  attachmentRows.sort((a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)));

  const attachmentsDecorated = attachmentRows.map((a) => ({
    ...a,
    container_number: a.container_id ? numberByContainer[a.container_id as string] ?? null : null,
    scope: a.container_id ? "container" as const : "shipment" as const,
  }));

  const primary = containerList[0] as Record<string, unknown> | undefined;
  const primaryId = primary?.id as string | undefined;
  const primaryLoc = primary?.location as Record<string, unknown> | null | undefined;
  const primaryTr = primaryId ? trByContainer[primaryId] : undefined;

  const lastSyncTimes = [
    ...containerList.map((c) => c.last_synced_at as string | null),
    ...Object.values(trByContainer).map((t) => t.last_sync_at),
  ].filter(Boolean) as string[];
  const lastSync = lastSyncTimes.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

  const freshnessMinutes = lastSync
    ? Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)
    : null;

  const carrierStatuses = containerList.map((c) => c.status as string | null);
  const status = (primary?.status as string | null) ?? (shipment.workflow_status as string | null);
  const computedRisk = riskFromStatus(status);
  const risk = resolveShipmentRiskLevel(
    shipment.risk_level as string | null | undefined,
    computedRisk,
  );

  const lastKnown =
    primaryLoc?.last_location ??
    primaryLoc?.discharging_port ??
    primaryLoc?.loading_port ??
    null;

  const workflowStatuses = Object.values(trByContainer).map((t) => t.status);
  const trackingWorkflowAggregate = workflowStatuses.length > 0
    ? aggregateWorkflowStatus(workflowStatuses)
    : "pending";

  const containerLines = containerList.map((c) => {
    const row = c as Record<string, unknown>;
    const cid = row.id as string;
    const loc = row.location as Record<string, unknown> | null | undefined;
    const tr = trByContainer[cid];
    return {
      id: cid,
      container_number: row.container_number,
      carrier: row.carrier ?? null,
      status: row.status ?? null,
      last_synced_at: row.last_synced_at ?? null,
      tracking_request_status: tr?.status ?? null,
      last_known_location:
        loc?.last_location ?? loc?.discharging_port ?? loc?.loading_port ?? null,
    };
  });

  const commercialLines = (lineRows ?? []).map((line) => ({
    id: line.id,
    shipment_id: line.shipment_id,
    container_id: line.container_id ?? null,
    container_number: line.container_number ?? null,
    order_number: line.order_number ?? null,
    carrier_booking_number: line.carrier_booking_number ?? null,
    customer_name: line.customer_name ?? shipment.customer_name ?? null,
    consignee: line.consignee ?? shipment.consignee ?? null,
    country: line.country ?? shipment.country ?? null,
    port_of_loading: line.port_of_loading ?? shipment.port_of_loading ?? null,
    port_of_destination: line.port_of_destination ?? shipment.port_of_destination ?? null,
    estimated_departure_at: line.estimated_departure_at ?? shipment.estimated_departure_at ?? null,
    estimated_arrival_at: line.estimated_arrival_at ?? shipment.estimated_arrival_at ?? null,
    freight_booking_carrier: line.freight_booking_carrier ?? shipment.freight_booking_carrier ?? null,
    vessel: line.vessel ?? shipment.vessel ?? null,
    voyage: line.voyage ?? shipment.voyage ?? null,
    health_certificate_no: line.health_certificate_no ?? shipment.health_certificate_no ?? null,
    trade_terms: line.trade_terms ?? shipment.trade_terms ?? null,
    sort_order: line.sort_order ?? 0,
  }));

  const summary: Record<string, unknown> = {
    order_number: shipment.order_number,
    container_number: primary?.container_number ?? shipment.container_number ?? commercialLines[0]?.container_number,
    container_count: containerList.length,
    carrier: primary?.carrier ?? shipment.freight_booking_carrier ?? null,
    status,
    carrier_statuses: carrierStatuses,
    last_known_location: lastKnown,
    tracking_request_status: trackingWorkflowAggregate,
    last_updated_at: lastSync ?? null,
    freshness_minutes: freshnessMinutes,
    shipment_context:
      primaryLoc && typeof primaryLoc === "object" && !Array.isArray(primaryLoc)
        ? { ...(primaryLoc as Record<string, unknown>) }
        : null,
  };

  applyVisibilityToSummary(summary, settings);
  applyOperatorOverrides(summary, operatorOverrides);

  const riskMessage =
    typeof shipment.risk_message === "string" ? shipment.risk_message.trim() : "";
  if (riskMessage) summary.customer_note = riskMessage;

  const payload: Record<string, unknown> = {
    report: reportMeta,
    organization: org
      ? {
        id: org.id as string,
        name: org.name,
        slug: org.slug,
        org_image_path: org.org_image_path ?? null,
      }
      : null,
    summary,
    container_lines: containerLines,
    commercial_details: {
      customer_name: shipment.customer_name ?? null,
      consignee: shipment.consignee ?? null,
      order_number: shipment.order_number ?? null,
      carrier_booking_number: shipment.carrier_booking_number ?? null,
      container_number:
        (primary?.container_number as string | null) ??
        (shipment.container_number as string | null) ??
        null,
      country: shipment.country ?? null,
      port_of_loading: shipment.port_of_loading ?? null,
      port_of_destination: shipment.port_of_destination ?? null,
      estimated_departure_at: shipment.estimated_departure_at ?? null,
      estimated_arrival_at: shipment.estimated_arrival_at ?? null,
      freight_booking_carrier: shipment.freight_booking_carrier ?? null,
      vessel: shipment.vessel ?? null,
      voyage: shipment.voyage ?? null,
      health_certificate_no: shipment.health_certificate_no ?? null,
      trade_terms: shipment.trade_terms ?? null,
      physical_mail_tracking_number: shipment.physical_mail_tracking_number ?? null,
      physical_mail_sent_at: shipment.physical_mail_sent_at ?? null,
      workflow_status: shipment.workflow_status ?? "pending_drafts",
      lines: commercialLines,
    },
    activity_events: (activityRows ?? []).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      body: e.body,
      actor_kind: e.actor_kind,
      occurred_at: e.occurred_at,
      metadata: e.metadata ?? {},
    })),
    shipment_id: shipmentId,
    primary_container_id: primaryId ?? null,
    insights: {
      risk_level: risk,
      headline: headlineFromSummary({ status, risk, freshnessMinutes }),
    },
    timeline: showTimeline ? eventsDecorated : [],
    alerts: includeAlerts ? alerts ?? [] : [],
    messages: messagesDecorated,
    attachments: attachmentsDecorated,
    profile_image_path_by_user_id: profileImagePathByUserId,
    profile_email_by_user_id: profileEmailByUserId,
  };

  if (includeRaw && primary?.raw_external) {
    payload.raw_external = primary.raw_external;
  }

  const enrichment = primary?.enrichment as Record<string, unknown> | null | undefined;
  if (showAis && enrichment && typeof enrichment === "object" && Object.keys(enrichment).length > 0) {
    payload.enrichment = enrichment;
    const ais = enrichment.vessel_ais as Record<string, unknown> | undefined;
    const aisEta = ais?.eta_UTC;
    const carrierEta = primaryLoc?.eta_final_destination ?? primaryLoc?.eta_next_destination;
    const hours = etaDivergenceHours(carrierEta, aisEta);
    if (hours != null && Math.abs(hours) >= 6) {
      payload.logistics_hints = {
        ais_vs_carrier_eta_hours: hours,
        note:
          "AIS-derived ETA differs from carrier-reported ETA by several hours or more. Treat AIS as indicative only.",
      };
    }
  }

  if (shipmentAccessMeta) {
    payload.shipment_access = shipmentAccessMeta;
  }

  return { ok: true, payload };
}

export async function buildPublicReportPayload(
  admin: SupabaseClient,
  shareId: string,
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const { data: share, error: shareErr } = await fetchSharedReportById(admin, shareId);

  if (shareErr) {
    return { ok: false, status: 500, error: shareErr.message };
  }
  if (!share) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  if (share.revoked_at) {
    return { ok: false, status: 410, error: "This report link is no longer active" };
  }
  if (share.expires_at && new Date(share.expires_at as string) < new Date()) {
    return { ok: false, status: 410, error: "This report link has expired" };
  }

  const settings = mergeVisibilitySettings(share.settings as Record<string, unknown>);
  const reportMeta: ShipmentPortalReportMeta = {
    id: share.id as string,
    title: share.title as string | null,
    created_at: share.created_at as string,
    expires_at: share.expires_at as string | null,
  };

  return buildShipmentPortalPayload(
    admin,
    share.shipment_id as string,
    settings,
    {},
    reportMeta,
    null,
    undefined,
  );
}

/** Portal payload for a row in `shipment_customer_access` (importer grant + visibility). */
export async function buildImporterGrantShipmentPayload(
  admin: SupabaseClient,
  accessRow: Record<string, unknown>,
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const shipmentId = accessRow.shipment_id as string;
  const settings = mergeVisibilitySettings(accessRow.visibility_settings as Record<string, unknown>);
  const overrides = (accessRow.operator_overrides ?? {}) as Record<string, unknown>;

  const reportMeta: ShipmentPortalReportMeta = {
    id: accessRow.id as string,
    title: null,
    created_at: accessRow.created_at as string,
    expires_at: null,
  };

  const shipmentAccessMeta = {
    id: accessRow.id,
    configuration_reminder_due_at: accessRow.configuration_reminder_due_at ?? null,
    profile_completed_at: accessRow.profile_completed_at ?? null,
  };

  return buildShipmentPortalPayload(
    admin,
    shipmentId,
    settings,
    overrides,
    reportMeta,
    shipmentAccessMeta,
    undefined,
  );
}
