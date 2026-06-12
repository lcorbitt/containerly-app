import { createServiceClient } from "@services/db.ts";
import { jsonResponse } from "@services/utils.ts";

type OrgSettings = {
  sla_response_hours: number;
  stale_update_reminder_hours: number;
};

function parseSettings(raw: unknown): OrgSettings {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sla = Number(row.sla_response_hours);
  const stale = Number(row.stale_update_reminder_hours);
  return {
    sla_response_hours: Number.isFinite(sla) && sla > 0 ? sla : 24,
    stale_update_reminder_hours: Number.isFinite(stale) && stale > 0 ? stale : 48,
  };
}

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST" && req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const headerSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || headerSecret !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createServiceClient();
    const now = Date.now();
    let remindersCreated = 0;

    const { data: orgRows, error: orgErr } = await admin
      .from("organizations")
      .select("id, performance_settings");
    if (orgErr) throw orgErr;

    for (const org of orgRows ?? []) {
      const orgId = org.id as string;
      const settings = parseSettings(org.performance_settings);
      const slaCutoff = new Date(now - settings.sla_response_hours * 3_600_000).toISOString();

      const { data: msgRows, error: msgErr } = await admin
        .from("report_messages")
        .select("id, shipment_id, author_kind, created_at")
        .eq("organization_id", orgId)
        .not("shipment_id", "is", null)
        .is("container_id", null)
        .eq("is_internal", false)
        .eq("author_kind", "customer")
        .lte("created_at", slaCutoff)
        .order("created_at", { ascending: false })
        .limit(200);
      if (msgErr) throw msgErr;

      const seenShipments = new Set<string>();
      for (const msg of msgRows ?? []) {
        const shipmentId = msg.shipment_id as string | null;
        if (!shipmentId || seenShipments.has(shipmentId)) continue;

        const { data: newerOperator } = await admin
          .from("report_messages")
          .select("id")
          .eq("shipment_id", shipmentId)
          .is("container_id", null)
          .in("author_kind", ["operator", "team"])
          .gt("created_at", msg.created_at as string)
          .limit(1);
        if ((newerOperator ?? []).length > 0) continue;

        seenShipments.add(shipmentId);

        const { data: shipmentRow } = await admin
          .from("shipments")
          .select("assignee_user_id, created_by")
          .eq("id", shipmentId)
          .maybeSingle();
        const recipient =
          (shipmentRow?.assignee_user_id as string | null) ??
          (shipmentRow?.created_by as string | null);
        if (!recipient) continue;

        const { error: alertErr } = await admin.from("alerts").insert({
          organization_id: orgId,
          shipment_id: shipmentId,
          alert_type: "SLA_RESPONSE_DUE",
          inbox_kind: "operational_alert",
          severity: "warning",
          message: "Customer waiting beyond SLA — reply when you can",
          recipient_user_id: recipient,
          details: {
            sla_response_hours: settings.sla_response_hours,
            customer_message_at: msg.created_at,
          },
        });
        if (!alertErr) remindersCreated += 1;
      }
    }

    return jsonResponse({ ok: true, reminders_created: remindersCreated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
