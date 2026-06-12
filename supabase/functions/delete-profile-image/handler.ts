import { requireAuthUserId } from "@services/auth.ts";
import { clearProfileImagePath } from "@services/profile/profile.service.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    let body: { storagePath?: string };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const storagePath = typeof body.storagePath === "string" ? body.storagePath.trim() : "";
    if (!storagePath) {
      return jsonResponse({ error: "storagePath required" }, { status: 400 });
    }

    const result = await clearProfileImagePath(userClient, {
      userId: auth.userId,
      storagePath,
    });
    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
