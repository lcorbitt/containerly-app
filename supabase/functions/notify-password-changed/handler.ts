import { requireAuthUser } from "@supabase-shared/auth.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { sendPasswordChangedEmail } from "@supabase-shared/email.service.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";

function loginUrl(): string {
  const base = Deno.env.get("PUBLIC_SITE_URL")?.trim().replace(/\/$/, "") ?? "";
  return base ? `${base}/login` : "/login";
}

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUser(userClient);
    if (!auth.ok) return auth.response;

    const email = auth.emailLower;
    if (!email) {
      return jsonResponse({ error: "Account email not found" }, { status: 400 });
    }

    const result = await sendPasswordChangedEmail({ to: email, loginUrl: loginUrl() });
    if (!result.ok) {
      return jsonResponse({ error: result.error }, { status: 502 });
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
