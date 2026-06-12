import { requireAuthUser, requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { removeWorkspaceAttachmentByIdForUser } from "@services/workspace/workspace.service";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "DELETE") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const url = new URL(req.url);
    const attachmentId = url.searchParams.get("attachment_id")?.trim() ?? "";
    if (!attachmentId || !UUID_RE.test(attachmentId)) return jsonResponse({ error: "Invalid attachment_id" }, { status: 400 });
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    await removeWorkspaceAttachmentByIdForUser(userClient, attachmentId);
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
