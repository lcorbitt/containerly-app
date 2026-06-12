export const SET_PASSWORD_PATH = "/set-password";

export function resolveSiteUrl(): string {
  const base =
    (typeof Deno !== "undefined" ? Deno.env.get("SITE_URL") : undefined)?.trim() ||
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SITE_URL?.trim() : undefined) ||
    (typeof process !== "undefined" ? process.env.SITE_URL?.trim() : undefined) ||
    "";
  return base.replace(/\/$/, "");
}

/** Supabase Auth redirect target: exchanges PKCE code then forwards to `nextPath`. */
export function authCallbackUrl(nextPath = "/dashboard"): string | undefined {
  const base = resolveSiteUrl();
  if (!base) return undefined;
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function inviteRedirectTo(): string | undefined {
  return authCallbackUrl(SET_PASSWORD_PATH);
}
