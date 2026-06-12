import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { fetchMembershipByOrgAndUser } from "@models/organization_members.ts";
import { fetchProfileRole } from "@models/profiles.ts";
import { fetchBolContainers, getJsoncargoConfig } from "./providers/jsoncargo/client.ts";
import { toJsoncargoShippingLineParam } from "./providers/jsoncargo/shipping-line.ts";
import type { LookupBolContainersResponse } from "@shared/dto/tracking.dto.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Err = { ok: false; status: number; error: string };

export async function lookupBolContainers(
  userClient: SupabaseClient,
  userId: string,
  input: { organization_id: string; bill_of_lading: string; shipping_line?: string },
): Promise<{ ok: true } & LookupBolContainersResponse | Err> {
  const orgId = input.organization_id?.trim() ?? "";
  const bol = input.bill_of_lading?.trim() ?? "";
  if (!orgId || !UUID_RE.test(orgId)) return { ok: false, status: 400, error: "Invalid organization_id" };
  if (!bol) return { ok: false, status: 400, error: "bill_of_lading required" };

  const [{ data: mem }, { data: prof }] = await Promise.all([
    fetchMembershipByOrgAndUser(userClient, orgId, userId),
    fetchProfileRole(userClient, userId),
  ]);

  const isSuper = (prof?.role as string | undefined) === "superadmin";
  if (!isSuper && !mem) return { ok: false, status: 403, error: "Not a member of this organization" };

  const cfg = getJsoncargoConfig();
  if (!cfg) {
    return { ok: false, status: 503, error: "External tracking API not configured (EXTERNAL_TRACKING_API_URL / KEY)" };
  }

  const clientLine = input.shipping_line?.trim() || null;
  const envelope = await fetchBolContainers(cfg.baseUrl, cfg.apiKey, bol, {
    shippingLine: clientLine ?? undefined,
  });
  const data = envelope.data as Record<string, unknown> | undefined;
  const nums = data?.associated_container_numbers;
  const list = Array.isArray(nums) ? nums.map((x) => String(x).trim().toUpperCase()).filter(Boolean) : [];

  const mapped = toJsoncargoShippingLineParam(
    data?.shipping_line_name as string | undefined,
    data?.shipping_line_id as string | undefined,
  );
  const shipping_line = mapped ?? clientLine;

  return {
    ok: true,
    bill_of_lading: (data?.bill_of_lading as string) ?? bol,
    shipping_line_name: (data?.shipping_line_name as string) ?? null,
    shipping_line_id: (data?.shipping_line_id as string) ?? null,
    shipping_line,
    associated_container_numbers: list,
  };
}
