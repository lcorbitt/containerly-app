import { requireAuthUserId } from "@services/auth";
import { updateProfileFullNameForUser } from "@services/profile/profile.service";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    let body: { full_name?: string | null };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const raw = body.full_name;
    const fullName =
      raw === null || raw === undefined
        ? null
        : typeof raw === "string"
          ? raw.trim() || null
          : null;

    await updateProfileFullNameForUser(userClient, auth.userId, fullName);
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
