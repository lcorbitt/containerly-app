import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { createClient } from "@/lib/supabase/client";
import { apiJson } from "@/utils/api-client";
import type { TrackingRequest } from "@/types/database";
import type { TrackingDashboardSnapshot } from "@/types/tracking-dashboard-snapshot";
import type {
  CreateTrackingRequestBody,
  CreateTrackingRequestResponse,
  SyncContainerBody,
} from "@shared/dto/tracking.dto";
import {
  normalizeOperatorSortColumn,
  OPERATOR_REQUEST_SORT_COLUMNS,
  type OperatorRequestScope,
  type OperatorRequestSortColumn,
  type SortDirection,
} from "@/utils/operator-tracking-requests";

export type { TrackingDashboardSnapshot };
export {
  normalizeOperatorSortColumn,
  OPERATOR_REQUEST_SORT_COLUMNS,
  type OperatorRequestScope,
  type OperatorRequestSortColumn,
  type SortDirection,
};

// ---------------------------------------------------------------------------
// Dashboard snapshot
// ---------------------------------------------------------------------------

/** Dashboard snapshot via Next API (no browser PostgREST). */
export async function fetchTrackingDashboardSnapshot(
  organizationId: string,
): Promise<TrackingDashboardSnapshot> {
  const { snapshot } = await apiJson<{ snapshot: TrackingDashboardSnapshot }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/tracking-dashboard`,
  );
  return snapshot;
}

// ---------------------------------------------------------------------------
// Recent tracking requests (browser)
// ---------------------------------------------------------------------------

export async function fetchRecentTrackingRequestsForOrganization(
  organizationId: string,
  limit = 50,
): Promise<TrackingRequest[]> {
  const q = new URLSearchParams({ limit: String(limit) });
  const { requests } = await apiJson<{ requests: TrackingRequest[] }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/tracking-requests/recent?${q}`,
  );
  return requests;
}

// ---------------------------------------------------------------------------
// Operator tracking-requests page (browser → API)
// ---------------------------------------------------------------------------

export async function loadOperatorTrackingRequestsPageBrowser(args: {
  organizationId: string;
  scope: OperatorRequestScope;
  page: number;
  pageSize: number;
  sortColumn: OperatorRequestSortColumn;
  sortDirection: SortDirection;
  search: string;
}): Promise<{ rows: TrackingRequest[]; totalCount: number }> {
  const sp = new URLSearchParams({
    page: String(args.page),
    pageSize: String(args.pageSize),
    scope: args.scope,
    sortColumn: args.sortColumn,
    sortDirection: args.sortDirection,
    search: args.search,
  });
  return apiJson<{ rows: TrackingRequest[]; totalCount: number }>(
    `/api/organizations/${encodeURIComponent(args.organizationId)}/operator-tracking-requests?${sp}`,
  );
}

// ---------------------------------------------------------------------------
// Edge Function calls (browser-side)
// ---------------------------------------------------------------------------

function requireEnv(): { base: string; anon: string } {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!base || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required");
  }
  return { base: base.replace(/\/$/, ""), anon };
}

async function callEdgeFunction(name: string, body: Record<string, unknown>): Promise<unknown> {
  const { base, anon } = requireEnv();
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${base}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anon,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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

export async function createTrackingRequest(
  args: CreateTrackingRequestBody,
): Promise<CreateTrackingRequestResponse> {
  const body: Record<string, unknown> = {
    organization_id: args.organization_id,
    container_number: args.container_number,
    run_sync: args.run_sync !== false,
  };
  if (args.shipment_group_id != null && args.shipment_group_id !== "")
    body.shipment_group_id = args.shipment_group_id;
  if (args.source_bill_of_lading?.trim())
    body.source_bill_of_lading = args.source_bill_of_lading.trim();
  if (args.shipping_line?.trim()) body.shipping_line = args.shipping_line.trim();
  if (args.shipment_id != null && args.shipment_id !== "")
    body.shipment_id = args.shipment_id.trim();
  if (args.shipment_reference?.trim())
    body.shipment_reference = args.shipment_reference.trim();

  const raw = (await callEdgeFunction(EDGE_FUNCTION_SLUGS.tracking.createRequest, body)) as CreateTrackingRequestResponse;
  if (raw?.sync_error) throw new Error(raw.sync_error);
  return raw;
}

export async function syncContainer(args: SyncContainerBody): Promise<unknown> {
  return callEdgeFunction(EDGE_FUNCTION_SLUGS.tracking.syncContainer, args as unknown as Record<string, unknown>);
}
