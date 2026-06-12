import { requireAuthUser, requireAuthUserId } from "@services/auth";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { uploadContainerWorkspaceDocumentsForUser } from "@services/workspace/workspace.service";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const formData = await req.formData();
    const organizationId = String(formData.get("organization_id") ?? "").trim();
    const containerId = String(formData.get("container_id") ?? "").trim();
    if (!UUID_RE.test(organizationId) || !UUID_RE.test(containerId)) {
      return jsonResponse({ error: "Invalid organization_id or container_id" }, { status: 400 });
    }
    const isInternal = formData.get("isInternal") === "true";
    const files = formData.getAll("file").filter((x): x is File => x instanceof File && x.size > 0);
    const result = await uploadContainerWorkspaceDocumentsForUser(userClient, auth.userId, {
      organizationId, containerId, files, isInternal,
    });
    return jsonResponse(result);
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
