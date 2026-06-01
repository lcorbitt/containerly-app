import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse } from "./utils.ts";

export async function requireAuthUser(
  userClient: SupabaseClient,
): Promise<
  { ok: true; userId: string; emailLower: string } | { ok: false; response: Response }
> {
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, response: jsonResponse({ error: "Unauthorized" }, { status: 401 }) };
  }
  return {
    ok: true,
    userId: userData.user.id,
    emailLower: (userData.user.email ?? "").trim().toLowerCase(),
  };
}

export async function requireAuthUserId(
  userClient: SupabaseClient,
): Promise<{ ok: true; userId: string } | { ok: false; response: Response }> {
  const r = await requireAuthUser(userClient);
  if (!r.ok) return r;
  return { ok: true, userId: r.userId };
}
