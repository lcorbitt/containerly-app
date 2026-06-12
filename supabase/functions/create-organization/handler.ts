import { requireAuthUserId, requireSuperadmin } from "@services/auth.ts";
import {
  createOrganizationWithInitialAdmin,
  resolveUserIdByEmail,
} from "@services/organization/organization.service.ts";
import { createServiceClient, createUserClient } from "@services/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils.ts";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const superadmin = await requireSuperadmin(userClient, auth.userId);
    if (!superadmin.ok) return superadmin.response;

    let body: {
      name?: string;
      slug?: string | null;
      initial_admin_user_id?: string;
      initial_admin_email?: string;
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

    let adminUserId =
      typeof body.initial_admin_user_id === "string" && body.initial_admin_user_id.trim() !== ""
        ? body.initial_admin_user_id.trim()
        : auth.userId;

    const admin = createServiceClient();

    const initialAdminEmail =
      typeof body.initial_admin_email === "string" ? body.initial_admin_email.trim().toLowerCase() : "";
    if (initialAdminEmail) {
      if (!initialAdminEmail.includes("@")) {
        return jsonResponse({ error: "Valid initial admin email is required" }, { status: 400 });
      }
      const resolved = await resolveUserIdByEmail(admin, initialAdminEmail);
      if (resolved.error || !resolved.userId) {
        return jsonResponse(
          { error: resolved.error ?? "Could not resolve initial admin user" },
          { status: 400 },
        );
      }
      adminUserId = resolved.userId;
    }

    const result = await createOrganizationWithInitialAdmin({
      admin,
      name,
      slugInput,
      adminUserId,
    });

    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: result.status });
    }

    return jsonResponse({ id: result.organizationId });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
