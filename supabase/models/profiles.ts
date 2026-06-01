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
