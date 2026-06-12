import { requireAuthUserId } from "@supabase-shared/auth.ts";
import { clearOrganizationImagePath } from "@supabase-shared/organization-operations.service.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    let body: { organization_id?: string; storagePath?: string };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const organizationId = body.organization_id?.trim() ?? "";
    const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
    if (!organizationId || !storagePath) {
      return jsonResponse({ error: "organization_id and storagePath are required" }, { status: 400 });
    }

    const result = await clearOrganizationImagePath(userClient, { organizationId, storagePath });
    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
