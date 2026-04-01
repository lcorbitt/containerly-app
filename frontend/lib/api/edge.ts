/**
 * Call Supabase Edge Functions with the logged-in user's JWT.
 * Never use the service role key in the browser.
 */

export async function invokeEdgeFunction<T = unknown>(
  name: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const url = `${base.replace(/\/$/, "")}/functions/v1/${name}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON */
  }

  if (!res.ok) {
    const err = body as { error?: string };
    throw new Error(err?.error ?? res.statusText ?? "Edge function error");
  }

  return body as T;
}
