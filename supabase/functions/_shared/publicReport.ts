import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { headlineFromSummary, riskFromStatus } from "./reportInsights.ts";

export type ShareSettings = {
  include_raw_external?: boolean;
  include_alerts?: boolean;
};

export async function buildPublicReportPayload(
  admin: SupabaseClient,
  shareId: string,
): Promise<{ ok: true; payload: Record<string, unknown> } | { ok: false; status: number; error: string }> {
  const { data: share, error: shareErr } = await admin
    .from("shared_reports")
    .select("id, organization_id, tracking_request_id, title, settings, expires_at, revoked_at, created_at")
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

  const settings = (share.settings ?? {}) as ShareSettings;
  const includeRaw = settings.include_raw_external === true;
  const includeAlerts = settings.include_alerts !== false;

  const { data: org } = await admin
    .from("organizations")
    .select("id, name, slug")
    .eq("id", share.organization_id as string)
    .maybeSingle();

  const { data: tr, error: trErr } = await admin
    .from("tracking_requests")
    .select("*")
    .eq("id", share.tracking_request_id as string)
    .maybeSingle();

  if (trErr || !tr) {
    return { ok: false, status: 404, error: "Tracking request not found" };
  }

  let container: Record<string, unknown> | null = null;
  if (tr.container_id) {
    const { data: c } = await admin
      .from("containers")
      .select(
        "id, container_number, normalized_number, carrier, status, location, last_synced_at, last_checked_at, raw_external",
      )
      .eq("id", tr.container_id as string)
      .maybeSingle();
    container = c;
  }

  const { data: events } = await admin
    .from("tracking_events")
    .select("id, event_type, status, location, occurred_at")
    .eq("tracking_request_id", tr.id as string)
    .order("occurred_at", { ascending: false })
    .limit(100);

  let alerts: unknown[] | null = null;
  if (includeAlerts) {
    const { data: al } = await admin
      .from("alerts")
      .select("id, alert_type, severity, message, created_at")
      .eq("tracking_request_id", tr.id as string)
      .order("created_at", { ascending: false })
      .limit(20);
    alerts = al ?? [];
  }

  const { data: messages } = await admin
    .from("report_messages")
    .select("id, body, author_kind, author_display_name, created_at")
    .eq("tracking_request_id", tr.id as string)
    .eq("is_internal", false)
    .order("created_at", { ascending: true })
    .limit(200);

  const lastSync = (container?.last_synced_at ?? tr.last_sync_at) as string | null | undefined;
  const freshnessMinutes = lastSync
    ? Math.round((Date.now() - new Date(lastSync).getTime()) / 60000)
    : null;
  const status = (container?.status ?? tr.status) as string | null;
  const risk = riskFromStatus(status);

  const loc = container?.location as Record<string, unknown> | null | undefined;
  const lastKnown =
    loc?.last_location ??
    loc?.discharging_port ??
    loc?.loading_port ??
    null;

  const payload: Record<string, unknown> = {
    report: {
      id: share.id,
      title: share.title,
      created_at: share.created_at,
      expires_at: share.expires_at,
    },
    organization: org ? { name: org.name, slug: org.slug } : null,
    summary: {
      container_number: tr.container_number,
      carrier: container?.carrier ?? null,
      status,
      last_known_location: lastKnown,
      tracking_request_status: tr.status,
      last_updated_at: lastSync ?? null,
      freshness_minutes: freshnessMinutes,
      shipment_context:
        loc && typeof loc === "object" && !Array.isArray(loc)
          ? (loc as Record<string, unknown>)
          : null,
    },
    insights: {
      risk_level: risk,
      headline: headlineFromSummary({ status, risk, freshnessMinutes }),
    },
    timeline: events ?? [],
    alerts: includeAlerts ? alerts ?? [] : [],
    messages: messages ?? [],
  };

  if (includeRaw && container?.raw_external) {
    payload.raw_external = container.raw_external;
  }

  return { ok: true, payload };
}
