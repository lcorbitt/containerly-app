import { requireAuthUserId } from "@services/auth";
import { deleteOrganizationMemberById } from "@services/organization/organization.service";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "DELETE") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    let body: { membership_id?: string };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const membershipId = body.membership_id?.trim() ?? "";
    if (!membershipId) {
      return jsonResponse({ error: "membership_id is required" }, { status: 400 });
    }

    await deleteOrganizationMemberById(userClient, membershipId);
    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
