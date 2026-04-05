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
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  return { res, text };
}

/** Operator preview of what importers see (`preview-customer-shipment` Edge). */
export async function previewImporterPortalShipment(args: {
  shipmentId: string;
  visibilitySettings: Record<string, unknown>;
  operatorOverrides: Record<string, unknown>;
}): Promise<
  | { ok: true; data: PublicReportPayload }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("preview-customer-shipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipment_id: args.shipmentId,
        visibility_settings: args.visibilitySettings,
        operator_overrides: args.operatorOverrides,
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
    return { ok: true, data: body as PublicReportPayload };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function lookupBolContainers(args: {
  organizationId: string;
  billOfLading: string;
  /** Sent as BOL API `shipping_line` when the provider requires it. */
  shippingLine?: string | null;
}): Promise<
  | {
      ok: true;
      associated_container_numbers: string[];
      shipping_line_name: string | null;
      shipping_line_id: string | null;
      /** JSONCargo query enum for container sync (MAERSK, MSC, …). */
      shipping_line: string | null;
    }
  | { ok: false; status: number; error: string }
> {
  try {
    const r = await authFetch("lookup-bol-containers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization_id: args.organizationId,
        bill_of_lading: args.billOfLading.trim(),
        ...(args.shippingLine?.trim() ? { shipping_line: args.shippingLine.trim() } : {}),
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
    const data = body as {
      associated_container_numbers?: string[];
      shipping_line_name?: string | null;
      shipping_line_id?: string | null;
      shipping_line?: string | null;
    };
    return {
      ok: true,
      associated_container_numbers: data.associated_container_numbers ?? [],
      shipping_line_name: data.shipping_line_name ?? null,
      shipping_line_id: data.shipping_line_id ?? null,
      shipping_line: data.shipping_line ?? null,
    };
  } catch (e) {
    return { ok: false, status: 500, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
