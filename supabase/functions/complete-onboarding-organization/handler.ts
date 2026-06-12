import { requireAuthUser } from "@supabase-shared/auth.ts";
import { completeSignupOrganization } from "@supabase-shared/tenant-invite-operations.service.ts";
import { createServiceClient, createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUser(userClient);
    if (!auth.ok) return auth.response;

    let body: {
      name?: string;
      slug?: string | null;
      team_size?: string | null;
      monthly_shipment_volume?: string | null;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return jsonResponse({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return jsonResponse({ error: "name is required" }, { status: 400 });
    }

    const slugInput =
      typeof body.slug === "string" && body.slug.trim() !== "" ? body.slug.trim() : null;
    const teamSize =
      typeof body.team_size === "string" && body.team_size.trim() !== ""
        ? body.team_size.trim()
        : null;
    const monthlyShipmentVolume =
      typeof body.monthly_shipment_volume === "string" && body.monthly_shipment_volume.trim() !== ""
        ? body.monthly_shipment_volume.trim()
        : null;

    const admin = createServiceClient();
    const result = await completeSignupOrganization({
      admin,
      userId: auth.userId,
      emailLower: auth.emailLower,
      name,
      slugInput,
      teamSize,
      monthlyShipmentVolume,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    return jsonResponse({ id: result.organizationId, inviteId: result.inviteId });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
