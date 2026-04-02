import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Invoke a Supabase Edge Function using the session from Request cookies (same source as RSC).
 * Avoids client-only session quirks (e.g. @supabase/ssr singleton + HMR) that can yield Invalid JWT at Kong.
 */
export async function callEdgeFunctionServer(
  name: string,
  options: { body?: Record<string, unknown>; method?: string },
): Promise<unknown> {
  const supabase = await createClient();
  await supabase.auth.refreshSession();
  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();

  if (sessionErr) {
    throw new Error(sessionErr.message);
  }

  const token = session?.access_token;
  if (!token) {
    throw new Error("Not signed in");
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const url = `${base.replace(/\/$/, "")}/functions/v1/${name}`;
  const res = await fetch(url, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    /* leave as text */
  }

  if (!res.ok) {
    const o = parsed as { msg?: string; error?: string };
    throw new Error((o?.msg ?? o?.error ?? text) || res.statusText);
  }

  return parsed;
}
