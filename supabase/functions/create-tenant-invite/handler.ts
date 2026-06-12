import { requireAuthUserId, requireSuperadmin } from "@services/auth.ts";
import { createTenantInvite } from "@services/organization/tenant-invite.service.ts";
import { createServiceClient, createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const superadmin = await requireSuperadmin(userClient, auth.userId);
    if (!superadmin.ok) return superadmin.response;

    let body: { email?: string; suggested_org_name?: string | null };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const emailLower =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!emailLower || !emailLower.includes("@")) {
      return jsonResponse({ error: "Valid email is required" }, { status: 400 });
    }

    const admin = createServiceClient();
    const result = await createTenantInvite({
      admin,
      actingUserId: auth.userId,
      emailLower,
      suggestedOrgName: body.suggested_org_name,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    return jsonResponse({ inviteId: result.inviteId, invited: result.invited });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
