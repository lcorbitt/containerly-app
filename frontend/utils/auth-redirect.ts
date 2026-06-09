/** Shared auth redirect paths and callback URL builder (browser + server). */

export const SET_PASSWORD_PATH = "/set-password";
export const FORGOT_PASSWORD_PATH = "/forgot-password";

export function resolveSiteUrl(): string {
  if (typeof window !== "undefined") {
    const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (env) return env.replace(/\/$/, "");
    return window.location.origin;
  }
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || "";
  return base.replace(/\/$/, "");
}

/** Supabase Auth redirect target: exchanges PKCE code then forwards to `nextPath`. */
export function authCallbackUrl(nextPath = "/dashboard"): string | undefined {
  const base = resolveSiteUrl();
  if (!base) return undefined;
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${base}/auth/callback?next=${encodeURIComponent(next)}`;
}
