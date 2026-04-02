import type { PublicReportPayload } from "@/types/public-report";

function requireEnv(): { base: string; anon: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  return { base: base.replace(/\/$/, ""), anon };
}

/** Server or client: load customer-safe report (no user session). */
export async function fetchPublicReport(id: string): Promise<
  | { ok: true; data: PublicReportPayload }
  | { ok: false; status: number; error: string }
> {
  const { base, anon } = requireEnv();
  const url = `${base}/functions/v1/get-public-report?id=${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* leave */
  }

  if (!res.ok) {
    const err = body as { error?: string };
    return { ok: false, status: res.status, error: err?.error ?? res.statusText };
  }

  return { ok: true, data: body as PublicReportPayload };
}

export async function postPublicReportMessage(args: {
  reportId: string;
  body: string;
  authorDisplayName?: string;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const { base, anon } = requireEnv();
  const url = `${base}/functions/v1/post-public-report-message`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
    body: JSON.stringify({
      report_id: args.reportId,
      body: args.body,
      author_display_name: args.authorDisplayName?.trim() || undefined,
    }),
  });

  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* leave */
  }

  if (!res.ok) {
    const err = body as { error?: string };
    return { ok: false, status: res.status, error: err?.error ?? res.statusText };
  }

  return { ok: true };
}
