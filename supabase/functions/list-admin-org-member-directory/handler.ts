import { requireAuthUserId, requireSuperadmin } from "@services/auth.ts";
import { fetchAdminOrgMemberDirectoryRows } from "@services/organization/organization.service.ts";
import { createServiceClient, createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const superadmin = await requireSuperadmin(userClient, auth.userId);
    if (!superadmin.ok) return superadmin.response;

    const admin = createServiceClient();
    const rows = await fetchAdminOrgMemberDirectoryRows(userClient, admin);
    return jsonResponse({ rows });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
