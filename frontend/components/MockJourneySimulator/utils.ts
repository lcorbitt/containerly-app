/**
 * Base URL for browser → mock server control routes (`/__dev/reset`).
 * Edge Functions use `EXTERNAL_TRACKING_API_URL` in supabase/functions/.env instead.
 * In development, default to localhost so reset works without extra env.
 */
export function getMockControlBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MOCK_JSONCARGO_URL?.replace(/\/$/, "").trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:9999";
  }
  return "";
}

export async function waitOrAbort(
  totalMs: number,
  cancelledRef: React.MutableRefObject<boolean>,
): Promise<void> {
  const step = 250;
  let waited = 0;
  while (waited < totalMs) {
    if (cancelledRef.current) return;
    const slice = Math.min(step, totalMs - waited);
    await new Promise((r) => setTimeout(r, slice));
    waited += slice;
  }
}

/** Explicit opt-in for non-dev builds (e.g. staging). */
export function isMockJourneyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_MOCK_JOURNEY === "true";
}

/** Show simulate-journey UI only in `next dev` (hidden in production builds). */
export function shouldShowMockJourneyPanel(): boolean {
  return process.env.NODE_ENV === "development";
}
