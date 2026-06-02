import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

/** `profiles` — platform role for authz checks. */
export async function fetchProfileRole(client: SupabaseClient, userId: string) {
  return client.from("profiles").select("role").eq("id", userId).maybeSingle();
}

/** `profiles` — mark account as customer-only (no org membership). */
export async function updateProfileAccountKind(
  client: SupabaseClient,
  userId: string,
  accountKind: string,
) {
  return client.from("profiles").update({ account_kind: accountKind }).eq("id", userId);
}

/** `profiles` — email for transactional notifications. */
export async function fetchProfileEmailByUserId(client: SupabaseClient, userId: string) {
  return client.from("profiles").select("email").eq("id", userId).maybeSingle();
}

/** `profiles` — resolve user id by email (customer invite alerts). */
export async function fetchProfileIdByEmail(client: SupabaseClient, emailLower: string) {
  return client.from("profiles").select("id").eq("email", emailLower).maybeSingle();
}

/** `profiles` — avatar storage paths keyed by user id (message thread display). */
export async function fetchProfileImagePathsByUserIds(
  client: SupabaseClient,
  userIds: string[],
): Promise<Record<string, string | null>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return {};

  const { data } = await client.from("profiles").select("id, profile_image_path").in("id", ids);
  const out: Record<string, string | null> = {};
  for (const row of data ?? []) {
    const path = (row.profile_image_path as string | null | undefined)?.trim() || null;
    out[row.id as string] = path;
  }
  return out;
}
