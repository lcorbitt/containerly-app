import type { SupabaseClient } from "@supabase/supabase-js";

function decodeJwtPayload(token: string): { iss?: string } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    return JSON.parse(atob(b64 + pad)) as { iss?: string };
  } catch {
    return null;
  }
}

/** Compare API URL to JWT `iss` (e.g. http://127.0.0.1:54321/auth/v1). Treat localhost ↔ 127.0.0.1 as same. */
function issuerMatchesProject(iss: string, supabaseUrl: string): boolean {
  try {
    const want = new URL(supabaseUrl);
    const got = new URL(iss);
    const normHost = (h: string) => (h === "localhost" ? "127.0.0.1" : h);
    return (
      normHost(want.hostname) === normHost(got.hostname) &&
      want.port === got.port &&
      got.pathname.startsWith("/auth")
    );
  } catch {
    return true;
  }
}

function assertIssuerMatchesEnv(accessToken: string, supabaseUrl: string): void {
  const payload = decodeJwtPayload(accessToken);
  const iss = payload?.iss;
  if (typeof iss !== "string" || !iss) return;
  if (!issuerMatchesProject(iss, supabaseUrl)) {
    throw new Error(
      `Your login session is for a different Supabase project than this app. Token issuer: "${iss}". App URL: "${supabaseUrl}". Sign out, clear site data for this site (Application → Storage), then sign in again.`,
    );
  }
}

/**
 * Fresh access token for Edge Function calls (create-tracking-request, sync-container, …).
 * Refreshes the session when possible, then checks the JWT issuer matches NEXT_PUBLIC_SUPABASE_URL
 * so you don't get a cryptic "Invalid JWT" when old tokens from another env are still in the browser.
 */
export async function getAccessTokenForEdgeFunctions(supabase: SupabaseClient): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
  let token = refreshData.session?.access_token;

  if (!token) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token ?? undefined;
  }

  if (!token) {
    throw new Error(refreshErr?.message ?? "Not signed in");
  }

  assertIssuerMatchesEnv(token, supabaseUrl);
  return token;
}
