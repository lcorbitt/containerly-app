import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const STALE_AUTH_SESSION_CODES = new Set([
  "refresh_token_not_found",
  "refresh_token_already_used",
  "session_not_found",
]);

function isStaleAuthSessionError(error: { code?: string } | null): boolean {
  return Boolean(error?.code && STALE_AUTH_SESSION_CODES.has(error.code));
}

/** Validates the session and clears auth cookies when refresh tokens are no longer valid. */
export async function refreshMiddlewareAuthSession(
  supabase: ReturnType<typeof createServerClient>,
): Promise<void> {
  const { error } = await supabase.auth.getUser();
  if (isStaleAuthSessionError(error)) {
    await supabase.auth.signOut();
  }
}

export async function createMiddlewareSupabase(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return { supabase: null as ReturnType<typeof createServerClient> | null, response };
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  return { supabase, response };
}
