import { requireAuthUser, requireAuthUserId } from "@services/auth.ts";
import { createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { renameWorkspaceAttachmentFileNameForUser } from "@services/workspace/workspace.service.ts";
import type { PatchWorkspaceAttachmentBody } from "@shared/dto/workspace.dto.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "PATCH") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const body = (await req.json()) as PatchWorkspaceAttachmentBody;
    const attachmentId = body.attachment_id?.trim() ?? "";
    const fileName = typeof body.file_name === "string" ? body.file_name.trim() : "";
    if (!attachmentId || !UUID_RE.test(attachmentId)) return jsonResponse({ error: "Invalid attachment_id" }, { status: 400 });
    if (!fileName) return jsonResponse({ error: "file_name required" }, { status: 400 });
    await renameWorkspaceAttachmentFileNameForUser(userClient, attachmentId, fileName);
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
