import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { headlineFromSummary, riskFromStatus } from "./reportInsights.ts";

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

  const { data: shipment, error: shErr } = await admin
    .from("shipments")
    .select("id, organization_id, reference, bill_of_lading, shipping_line, status")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shErr || !shipment) {
    return { ok: false, status: 404, error: "Shipment not found" };
  }

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", shipment.organization_id as string)
    .maybeSingle();

  const { data: containers } = await admin
    .from("containers")
    .select(
      "id, container_number, normalized_number, carrier, status, location, enrichment, last_synced_at, last_checked_at, raw_external",
    )
    .eq("shipment_id", shipmentId)
    .order("container_number", { ascending: true });

  const containerList = containers ?? [];
  const containerIds = containerList.map((c) => c.id as string);

  if (containerIds.length === 0) {
    return { ok: false, status: 404, error: "No containers on this shipment" };
  }

  const numberByContainer: Record<string, string> = {};
  for (const c of containerList) {
    numberByContainer[c.id as string] = c.container_number as string;
  }

  const { data: trRows } = await admin
    .from("tracking_requests")
    .select("id, status, container_id, last_sync_at")
    .in("container_id", containerIds);

  const trByContainer: Record<string, { status: string; last_sync_at: string | null }> = {};
  for (const tr of trRows ?? []) {
    const cid = tr.container_id as string | null;
    if (!cid) continue;
    trByContainer[cid] = {
      status: tr.status as string,
      last_sync_at: tr.last_sync_at as string | null,
    };
  }

  const { data: events } = await admin
    .from("tracking_events")
    .select("id, event_type, status, location, occurred_at, container_id")
    .in("container_id", containerIds)
    .order("occurred_at", { ascending: true })
    .limit(500);

  const eventsDecorated = (events ?? []).map((e) => ({
    ...e,
    container_number: e.container_id ? numberByContainer[e.container_id as string] ?? null : null,
  }));

  let alerts: unknown[] | null = null;
  if (includeAlerts) {
    const { data: al } = await admin
      .from("alerts")
      .select("id, alert_type, severity, message, created_at, container_id")
      .in("container_id", containerIds)
      .order("created_at", { ascending: false })
      .limit(50);
    alerts = (al ?? []).map((a) => ({
      ...a,
      container_number: a.container_id ? numberByContainer[a.container_id as string] ?? null : null,
    }));
  }

  const msgSelect =
    "id, body, author_kind, author_display_name, parent_message_id, created_at, is_internal, container_id, shipment_id";

  let qContainer = admin
    .from("report_messages")
    .select(msgSelect)
    .in("container_id", containerIds)
    .order("created_at", { ascending: true })
    .limit(400);
  let qShipment = admin
    .from("report_messages")
    .select(msgSelect)
    .eq("shipment_id", shipmentId)
    .is("container_id", null)
    .order("created_at", { ascending: true })
    .limit(200);
  if (!portalOptions?.includeInternalMessages) {
    qContainer = qContainer.eq("is_internal", false);
    qShipment = qShipment.eq("is_internal", false);
  }
  const [{ data: msgContainer }, { data: msgShipment }] = await Promise.all([qContainer, qShipment]);
  const messages = [...(msgContainer ?? []), ...(msgShipment ?? [])].sort(
    (a, b) => Date.parse(String(a.created_at)) - Date.parse(String(b.created_at)),
  );

  const messagesDecorated = messages.map((m) => ({
    ...m,
    container_number: m.container_id ? numberByContainer[m.container_id as string] ?? null : null,
    scope: m.container_id ? "container" as const : "shipment" as const,
  }));

  const attSelect =
    "id, file_name, content_type, file_size_bytes, created_at, container_id, shipment_id, report_message_id, storage_path, is_internal";

  const [{ data: attContainer }, { data: attShipment }] = await Promise.all([
    admin
      .from("workspace_attachments")
      .select(attSelect)
      .in("container_id", containerIds)
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("workspace_attachments")
      .select(attSelect)
      .eq("shipment_id", shipmentId)
      .is("container_id", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  let attachmentRows = [...(attContainer ?? []), ...(attShipment ?? [])];
  if (!portalOptions?.includeInternalMessages) {
    attachmentRows = attachmentRows.filter((a) => (a as { is_internal?: boolean }).is_internal === false);
  }
  attachmentRows.sort((a, b) => Date.parse(String(b.created_at)) - Date.parse(String(a.created_at)));

  const attachmentsDecorated = attachmentRows.map((a) => ({
    ...a,
    container_number: a.container_id ? numberByContainer[a.container_id as string] ?? null : null,
    scope: a.container_id ? "container" as const : "shipment" as const,
  }));

  const primary = containerList[0] as Record<string, unknown>;
  const primaryId = primary.id as string;
  const primaryLoc = primary.location as Record<string, unknown> | null | undefined;
  const primaryTr = trByContainer[primaryId];

  const lastSyncTimes = [
    ...containerList.map((c) => c.last_synced_at as string | null),
    ...Object.values(trByContainer).map((t) => t.last_sync_at),
  ].filter(Boolean) as string[];
  const lastSync = lastSyncTimes.sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;

  const freshnessMinutes = lastSync
    ? Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)
    : null;

  const carrierStatuses = containerList.map((c) => c.status as string | null);
  const status = (primary.status as string | null) ?? null;
  const risk = riskFromStatus(status);

  const lastKnown =
    primaryLoc?.last_location ??
    primaryLoc?.discharging_port ??
    primaryLoc?.loading_port ??
    null;

  const workflowStatuses = Object.values(trByContainer).map((t) => t.status);
  const trackingWorkflowAggregate = aggregateWorkflowStatus(workflowStatuses);

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

  const summary: Record<string, unknown> = {
    shipment_reference: shipment.reference,
    container_number: primary.container_number,
    container_count: containerList.length,
    carrier: primary.carrier ?? null,
    status,
    /** Highest-severity carrier status label across units (same as primary when one unit). */
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

  const payload: Record<string, unknown> = {
    report: reportMeta,
    organization: org ? { name: org.name, slug: org.slug } : null,
    summary,
    container_lines: containerLines,
    shipment_id: shipmentId,
    primary_container_id: primaryId,
    insights: {
      risk_level: risk,
      headline: headlineFromSummary({ status, risk, freshnessMinutes }),
    },
    timeline: showTimeline ? eventsDecorated : [],
    alerts: includeAlerts ? alerts ?? [] : [],
    messages: messagesDecorated,
    attachments: attachmentsDecorated,
  };

  if (includeRaw && primary.raw_external) {
    payload.raw_external = primary.raw_external;
  }

  const enrichment = primary.enrichment as Record<string, unknown> | null | undefined;
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
  const { data: share, error: shareErr } = await admin
    .from("shared_reports")
    .select("id, organization_id, shipment_id, title, settings, expires_at, revoked_at, created_at")
    .eq("id", shareId)
    .maybeSingle();

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
