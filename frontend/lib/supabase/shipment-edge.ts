import type { PublicReportPayload } from "@/types/public-report";
import { createClient } from "@/lib/supabase/client";

function requireEnv(): { base: string; anon: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  return { base: base.replace(/\/$/, ""), anon };
}

async function authFetch(
  path: string,
  init?: RequestInit,
): Promise<{ res: Response; text: string } | { error: string; status: number }> {
  const { base, anon } = requireEnv();
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { error: "Not signed in", status: 401 };
  }
  const url = `${base}/functions/v1/${path}`;
  const headers = new Headers(init?.headers);
  headers.set("apikey", anon);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, {
    ...init,
    headers,
  });
  const text = await res.text();
  return { res, text };
}

/** Shipment portal payload (operator, assignee/participant, or importer grant). */
export async function fetchShipment(shipmentId: string): Promise<
  | { ok: true; data: PublicReportPayload }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch(`get-shipment?shipment_id=${encodeURIComponent(shipmentId)}`, {
      method: "GET",
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true, data: body as PublicReportPayload };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function postShipmentThreadMessage(args: {
  shipmentId: string;
  /** Omit for shipment-wide thread (whole commercial shipment). */
  containerId?: string;
  body: string;
  authorDisplayName?: string;
  parentMessageId?: string | null;
}): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  try {
    const r = await authFetch("post-customer-shipment-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: args.shipmentId,
        ...(args.containerId ? { container_id: args.containerId } : {}),
        body: args.body,
        author_display_name: args.authorDisplayName?.trim() || undefined,
        ...(args.parentMessageId ? { parent_message_id: args.parentMessageId } : {}),
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function acceptImporterInvite(token: string): Promise<
  | { ok: true; shipment_id: string; already_had_access?: boolean }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("accept-customer-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    const data = body as { shipment_id: string; already_had_access?: boolean };
    return { ok: true, shipment_id: data.shipment_id, already_had_access: data.already_had_access };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Dismiss importer portal profile reminder (Edge: `complete-customer-shipment-setup`). */
export async function completeImporterPortalSetup(shipmentId: string): Promise<
  { ok: true } | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("complete-customer-shipment-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shipment_id: shipmentId }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function createImporterInvite(args: {
  organizationId: string;
  shipmentId: string;
  invitedEmail: string;
}): Promise<
  | { ok: true; invite_url: string; token?: string; expires_at: string }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("create-customer-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: args.organizationId,
        shipment_id: args.shipmentId,
        invited_email: args.invitedEmail.trim().toLowerCase(),
      }),
    });
    if ("error" in r) {
      return { ok: false, status: r.status, error: r.error };
    }
    let body: unknown = r.text;
    try {
      body = r.text ? JSON.parse(r.text) : null;
    } catch {
      /* leave */
    }
    if (!r.res.ok) {
      const err = body as { error?: string };
      return { ok: false, status: r.res.status, error: err?.error ?? r.res.statusText };
    }
    const data = body as { invite_url: string; token?: string; expires_at: string };
    return { ok: true, invite_url: data.invite_url, token: data.token, expires_at: data.expires_at };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
