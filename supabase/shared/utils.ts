export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

export function jsonResponse(
  body: unknown,
  init: ResponseInit & { status?: number } = {},
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...init.headers,
    },
  });
}

/** Heuristic for catch blocks when createUserClient threw or auth headers are wrong. */
export function isLikelyUnauthorizedFromCatch(message: string): boolean {
  return message.includes("Missing Supabase env") || message.includes("Authorization");
}

/** Stable message for catch blocks (matches previous edge behavior). */
export function edgeErrorMessage(e: unknown): string {
  return e instanceof Error
    ? e.message
    : e && typeof e === "object" && "message" in e
      ? String((e as { message: unknown }).message)
      : typeof e === "object"
        ? JSON.stringify(e)
        : String(e);
}
