import { requireAuthUser, requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { updateReportMessageByIdForUser } from "@supabase-shared/workspace-operations.service.ts";
import type { PatchReportMessageBody } from "@shared/dto/workspace.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const body = (await req.json()) as PatchReportMessageBody;
    const messageId = body.message_id?.trim() ?? "";
    const text = typeof body.body === "string" ? body.body : "";
    if (!messageId || !UUID_RE.test(messageId)) return jsonResponse({ error: "Invalid message_id" }, { status: 400 });
    const message = await updateReportMessageByIdForUser(userClient, auth.userId, messageId, text);
    return jsonResponse({ message });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
