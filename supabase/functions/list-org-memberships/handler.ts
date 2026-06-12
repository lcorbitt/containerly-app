import { requireAuthUserId } from "@services/auth.ts";
import { fetchOrgMembershipRows } from "@services/organization/organization.service.ts";
import { fetchProfileRole } from "@models/profiles.ts";
import { isSuperadminRole } from "@shared/profile-role.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const { data: profile } = await fetchProfileRole(userClient, auth.userId);
    const memberships = await fetchOrgMembershipRows(
      userClient,
      auth.userId,
      isSuperadminRole(profile?.role as string | undefined),
    );
    return jsonResponse({ memberships });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
