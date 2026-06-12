import { requireAuthUserId, requireSuperadmin } from "@services/auth.ts";
import { updateProfileRoleAsSuperadmin } from "@services/profile/profile.service.ts";
import { createServiceClient, createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const superadmin = await requireSuperadmin(userClient, auth.userId);
    if (!superadmin.ok) return superadmin.response;

    let body: { profile_id?: string; role?: string };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const profileId = body.profile_id?.trim() ?? "";
    if (!profileId) {
      return jsonResponse({ error: "profile_id is required" }, { status: 400 });
    }

    const admin = createServiceClient();
    const result = await updateProfileRoleAsSuperadmin({
      admin,
      profileId,
      role: body.role ?? "",
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }
    return jsonResponse({ profile: result.profile });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
