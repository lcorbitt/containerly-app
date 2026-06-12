import { requireAuthUser, requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { postContainerWorkspaceMessageForUser } from "@supabase-shared/workspace-operations.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUser(userClient);
    if (!auth.ok) return auth.response;
    const formData = await req.formData();
    const organizationId = String(formData.get("organization_id") ?? "").trim();
    const containerId = String(formData.get("container_id") ?? "").trim();
    if (!UUID_RE.test(organizationId) || !UUID_RE.test(containerId)) {
      return jsonResponse({ error: "Invalid organization_id or container_id" }, { status: 400 });
    }
    const body = String(formData.get("body") ?? "");
    const internalOnly = formData.get("internalOnly") === "true";
    const replyRaw = formData.get("replyParentId");
    const replyParentId = typeof replyRaw === "string" && replyRaw.trim() !== "" ? replyRaw.trim() : null;
    const files = formData.getAll("file").filter((x): x is File => x instanceof File && x.size > 0);
    const result = await postContainerWorkspaceMessageForUser(userClient, auth.userId, auth.emailLower || null, {
      organizationId, containerId, body, internalOnly, replyParentId, files,
    });
    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
