import { requireAuthUserId } from "@services/auth.ts";
import { inviteOrAddOrganizationMember } from "@services/organization/organization.service.ts";
import {
  fetchProfileDisplayName,
  notifyOrgAdminsMemberJoined,
} from "@services/notification/in-app-alerts.ts";
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

    let body: { organization_id?: string; email?: string; role?: string };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const orgId = typeof body.organization_id === "string" ? body.organization_id.trim() : "";
    const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role === "admin" ? "admin" : "member";

    if (!orgId) {
      return jsonResponse({ error: "organization_id is required" }, { status: 400 });
    }
    if (!emailRaw || !emailRaw.includes("@")) {
      return jsonResponse({ error: "Valid email is required" }, { status: 400 });
    }

    const admin = createServiceClient();
    const result = await inviteOrAddOrganizationMember({
      supabase: userClient,
      admin,
      actingUserId: auth.userId,
      organizationId: orgId,
      emailLower: emailRaw,
      role,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    const membership = result.membership;
    const newMemberUserId = membership.user_id as string;
    try {
      const memberDisplayName = await fetchProfileDisplayName(admin, newMemberUserId).catch(
        () => emailRaw,
      );
      await notifyOrgAdminsMemberJoined(admin, {
        organizationId: orgId,
        newMemberUserId,
        actorUserId: auth.userId,
        memberDisplayName,
        invited: result.invited,
      });
    } catch {
      /* alerts are best-effort */
    }

    return jsonResponse({ membership, invited: result.invited });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
