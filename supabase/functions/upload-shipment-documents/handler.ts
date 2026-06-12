import { requireAuthUser, requireAuthUserId } from "@supabase-shared/auth.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

import { uploadShipmentScopeStandaloneFilesForUser } from "@supabase-shared/workspace-operations.service.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;
    const formData = await req.formData();
    const organizationId = String(formData.get("organization_id") ?? "").trim();
    const shipmentId = String(formData.get("shipment_id") ?? "").trim();
    if (!UUID_RE.test(organizationId) || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid organization_id or shipment_id" }, { status: 400 });
    }
    const documentTypeRaw = formData.get("documentType");
    const documentGroupRaw = formData.get("documentGroup");
    const documentType = typeof documentTypeRaw === "string" && documentTypeRaw.trim() ? documentTypeRaw.trim() : null;
    const documentGroup = typeof documentGroupRaw === "string" && documentGroupRaw.trim() ? documentGroupRaw.trim() : null;
    const files = formData.getAll("file").filter((x): x is File => x instanceof File && x.size > 0);
    const uploaded = await uploadShipmentScopeStandaloneFilesForUser(userClient, auth.userId, {
      organizationId, shipmentId, files, documentType, documentGroup,
    });
    return jsonResponse({ uploaded });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    return jsonResponse({ error: message }, { status: 400 });
  }
}
