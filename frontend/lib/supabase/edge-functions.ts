import { createClient } from "@/lib/supabase/client";

function requireEnv(): { base: string; anon: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  return { base: base.replace(/\/$/, ""), anon };
}

/** Session JWT for Edge Functions (auth only — no PostgREST here). */
export async function getSessionAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.access_token ?? null;
}

/**
 * Authenticated fetch to `${SUPABASE_URL}/functions/v1/${path}`.
 * Prefer `path` values from `edge-function-slugs.ts` (`EDGE_FUNCTION_SLUGS`).
 * Shared transport from **`frontend/services/`** to **Supabase Edge** (handlers delegate to **`supabase/functions/_models/`** and **`supabase/functions/_services/`**).
 */
export async function edgeFunctionFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string } | { error: string; status: number }> {
  const { base, anon } = requireEnv();
  const token = await getSessionAccessToken();
  if (!token) {
    return { error: "Not signed in", status: 401 };
  }
  const url = `${base}/functions/v1/${path}`;
  const headers = new Headers(init?.headers);
  headers.set("apikey", anon);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  return { res, text };
}

/** Parse Edge JSON or throw with server error message. */
export async function parseEdgeJson<T>(
  result: { res: Response; text: string } | { error: string; status: number },
): Promise<T> {
  if ("error" in result) throw new Error(result.error);
  if (!result.res.ok) {
    let message = result.res.statusText;
    try {
      const parsed = JSON.parse(result.text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (result.text) message = result.text;
    }
    throw new Error(message);
  }
  return JSON.parse(result.text) as T;
}
