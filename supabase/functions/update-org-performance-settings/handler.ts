import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { updateOrganizationPerformanceSettings } from "@supabase-shared/organization-operations.service.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import type { OrgPerformanceSettings } from "@shared/dto/performance.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    let body: { organization_id?: string } & OrgPerformanceSettings;
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const organizationId = body.organization_id?.trim() ?? "";
    if (!organizationId) {
      return jsonResponse({ error: "organization_id is required" }, { status: 400 });
    }

    const settings = await updateOrganizationPerformanceSettings(userClient, {
      organizationId,
      settings: {
        sla_response_hours: body.sla_response_hours,
        stale_update_reminder_hours: body.stale_update_reminder_hours,
        required_document_types: body.required_document_types,
      },
    });
    return jsonResponse({ ok: true, settings });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
