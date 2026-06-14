import { createServiceClient } from "@services/db.ts";
import { countStaleShipmentSlaReminders } from "@services/notification/stale-shipment-reminders.service.ts";
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

      remindersCreated += await countStaleShipmentSlaReminders(
        admin,
        orgId,
        slaCutoff,
        settings.sla_response_hours,
      );
    }

    return jsonResponse({ ok: true, reminders_created: remindersCreated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
}
