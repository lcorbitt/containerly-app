import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { normalizeContainerNumber } from "./normalize.ts";
import { resolveShippingLineForTrackingRequest, syncContainerByNumber } from "./sync.ts";
import type {
  CreateTrackingRequestBody,
  CreateTrackingRequestResponse,
  SyncContainerResponse,
  GetContainerDetailsResponse,
  SearchContainerRow,
} from "@shared/dto/tracking.dto.ts";

type Err = { ok: false; status: number; error: string };

// ---------------------------------------------------------------------------
// create-tracking-request
// ---------------------------------------------------------------------------

export async function createTrackingRequest(
  userClient: SupabaseClient,
  admin: SupabaseClient | null,
  userId: string,
  input: CreateTrackingRequestBody,
): Promise<{ ok: true } & CreateTrackingRequestResponse | Err> {
  if (!input.organization_id || !input.container_number?.trim()) {
    return { ok: false, status: 400, error: "organization_id and container_number required" };
  }

  const normalized = normalizeContainerNumber(input.container_number);
  const bol = input.source_bill_of_lading?.trim() || null;
  const shippingLine = input.shipping_line?.trim() || null;
  const groupId =
    typeof input.shipment_group_id === "string" && input.shipment_group_id.trim()
      ? input.shipment_group_id.trim()
      : null;
  const attachShipmentId =
    !groupId && typeof input.shipment_id === "string" && input.shipment_id.trim()
      ? input.shipment_id.trim()
      : null;

  const { data: orgMembership, error: memErr } = await userClient
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", input.organization_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (memErr) throw memErr;

  let shipmentId: string;
  if (groupId) {
    const { data: existingShip, error: findShipErr } = await userClient
      .from("shipments")
      .select("id")
      .eq("organization_id", input.organization_id)
      .eq("shipment_group_id", groupId)
      .maybeSingle();
    if (findShipErr) throw findShipErr;
    if (existingShip?.id) {
      shipmentId = existingShip.id as string;
      if (shippingLine) {
        await userClient.from("shipments").update({ shipping_line: shippingLine }).eq("id", shipmentId);
      }
    } else {
      const ref = bol ?? `BOL import (${groupId.slice(0, 8)}…)`;
      const { data: ship, error: shipErr } = await userClient
        .from("shipments")
        .insert({
          organization_id: input.organization_id,
          created_by: userId,
          assignee_user_id: orgMembership?.user_id ? userId : null,
          reference: ref,
          bill_of_lading: bol,
          shipment_group_id: groupId,
          ...(shippingLine ? { shipping_line: shippingLine } : {}),
        })
        .select("id")
        .single();
      if (shipErr) throw shipErr;
      if (!ship?.id) throw new Error("Could not create shipment for BOL batch");
      shipmentId = ship.id as string;
    }
  } else if (attachShipmentId) {
    const { data: existing, error: exErr } = await userClient
      .from("shipments")
      .select("id")
      .eq("id", attachShipmentId)
      .eq("organization_id", input.organization_id)
      .maybeSingle();
    if (exErr) throw exErr;
    if (!existing?.id) return { ok: false, status: 404, error: "Shipment not found in this organization" };
    shipmentId = existing.id as string;
    if (shippingLine) {
      await userClient.from("shipments").update({ shipping_line: shippingLine }).eq("id", shipmentId);
    }
  } else {
    const ref = input.shipment_reference?.trim() || input.container_number.trim();
    const { data: ship, error: shipErr } = await userClient
      .from("shipments")
      .insert({
        organization_id: input.organization_id,
        created_by: userId,
        assignee_user_id: orgMembership?.user_id ? userId : null,
        reference: ref,
        bill_of_lading: bol,
        ...(shippingLine ? { shipping_line: shippingLine } : {}),
      })
      .select("id")
      .single();
    if (shipErr) throw shipErr;
    if (!ship?.id) throw new Error("Could not create shipment");
    shipmentId = ship.id as string;
  }

  const { data: containerRow, error: contErr } = await userClient
    .from("containers")
    .upsert(
      {
        organization_id: input.organization_id,
        shipment_id: shipmentId,
        container_number: input.container_number.trim(),
        normalized_number: normalized,
      },
      { onConflict: "organization_id,normalized_number" },
    )
    .select("id")
    .single();
  if (contErr) throw contErr;
  if (!containerRow?.id) throw new Error("Could not upsert container for shipment");

  const { data: inserted, error: insErr } = await userClient
    .from("tracking_requests")
    .insert({
      organization_id: input.organization_id,
      created_by: userId,
      container_id: containerRow.id as string,
      container_number: input.container_number.trim(),
      normalized_number: normalized,
      status: "pending",
      next_check_at: new Date().toISOString(),
      ...(bol ? { source_bill_of_lading: bol } : {}),
      ...(groupId ? { shipment_group_id: groupId } : {}),
    })
    .select()
    .single();
  if (insErr) throw insErr;

  if (orgMembership?.user_id) {
    const { data: shipRow } = await userClient
      .from("shipments")
      .select("assignee_user_id")
      .eq("id", shipmentId)
      .maybeSingle();
    if (shipRow && (shipRow as { assignee_user_id: string | null }).assignee_user_id == null) {
      await userClient.from("shipments").update({ assignee_user_id: userId }).eq("id", shipmentId);
    }
    const { error: spErr } = await userClient.from("shipment_participants").insert({
      shipment_id: shipmentId,
      user_id: userId,
    });
    if (spErr && spErr.code !== "23505") throw spErr;
  }

  if (input.run_sync !== false) {
    await userClient.from("tracking_requests").update({ status: "syncing" }).eq("id", inserted.id);
    const { data: shipForSync } = await userClient
      .from("shipments")
      .select("shipping_line")
      .eq("id", shipmentId)
      .maybeSingle();
    const syncShippingLine = (shipForSync?.shipping_line as string | null | undefined)?.trim() || null;

    try {
      await syncContainerByNumber(userClient, admin, input.organization_id, input.container_number.trim(), {
        trackingRequestId: inserted.id,
        shipmentId,
        forceRefresh: true,
        shippingLine: syncShippingLine,
      });
    } catch (syncErr) {
      const syncMessage = syncErr instanceof Error ? syncErr.message : String(syncErr);
      await userClient
        .from("tracking_requests")
        .update({ status: "failed", error_message: syncMessage })
        .eq("id", inserted.id);
      const { data: afterFail } = await userClient
        .from("tracking_requests")
        .select("*")
        .eq("id", inserted.id)
        .single();
      return {
        ok: true,
        tracking_request: (afterFail ?? inserted) as Record<string, unknown>,
        sync_error: syncMessage,
      };
    }
  }

  const { data: finalRow } = await userClient
    .from("tracking_requests")
    .select("*")
    .eq("id", inserted.id)
    .single();

  return { ok: true, tracking_request: (finalRow ?? inserted) as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// sync-container
// ---------------------------------------------------------------------------

export async function syncContainer(
  userClient: SupabaseClient,
  admin: SupabaseClient | null,
  input: {
    organization_id: string;
    container_number?: string;
    container_id?: string;
    tracking_request_id?: string;
    force?: boolean;
  },
): Promise<{ ok: true } & SyncContainerResponse | Err> {
  if (!input.organization_id) return { ok: false, status: 400, error: "organization_id required" };

  let number = input.container_number;
  if (!number && input.container_id) {
    const { data: row, error } = await userClient
      .from("containers")
      .select("container_number")
      .eq("organization_id", input.organization_id)
      .eq("id", input.container_id)
      .maybeSingle();
    if (error) throw error;
    if (!row) return { ok: false, status: 404, error: "Container not found" };
    number = row.container_number as string;
  }

  if (!number) return { ok: false, status: 400, error: "container_number or container_id required" };

  if (input.tracking_request_id) {
    const { data: tr, error: trErr } = await userClient
      .from("tracking_requests")
      .select("id, normalized_number")
      .eq("organization_id", input.organization_id)
      .eq("id", input.tracking_request_id)
      .maybeSingle();
    if (trErr) throw trErr;
    if (!tr) return { ok: false, status: 404, error: "Tracking request not found" };
    if (normalizeContainerNumber(number) !== (tr.normalized_number as string)) {
      return { ok: false, status: 400, error: "Container number does not match tracking request" };
    }
  }

  let shippingLine: string | null = null;
  if (input.tracking_request_id) {
    shippingLine = await resolveShippingLineForTrackingRequest(
      userClient,
      input.organization_id,
      input.tracking_request_id,
    );
  }

  let shipmentId: string | null = null;
  if (input.tracking_request_id) {
    const { data: trWithC } = await userClient
      .from("tracking_requests")
      .select("containers(shipment_id)")
      .eq("organization_id", input.organization_id)
      .eq("id", input.tracking_request_id)
      .maybeSingle();
    const nested = trWithC as {
      containers?: { shipment_id?: string | null } | { shipment_id?: string | null }[] | null;
    } | null;
    const c = nested?.containers;
    const one = Array.isArray(c) ? c[0] : c;
    if (typeof one?.shipment_id === "string") shipmentId = one.shipment_id;
  }

  const result = await syncContainerByNumber(userClient, admin, input.organization_id, number, {
    trackingRequestId: input.tracking_request_id,
    shipmentId,
    forceRefresh: Boolean(input.force),
    shippingLine,
  });

  return {
    ok: true,
    container: result.container as Record<string, unknown>,
    refreshed: result.refreshed,
    provider: result.data as Record<string, unknown> | undefined,
  };
}

// ---------------------------------------------------------------------------
// get-container-details
// ---------------------------------------------------------------------------

export async function getContainerDetails(
  userClient: SupabaseClient,
  admin: SupabaseClient | null,
  params: {
    organization_id: string;
    container_id?: string;
    number?: string;
    force?: boolean;
  },
): Promise<{ ok: true } & GetContainerDetailsResponse | Err> {
  if (!params.organization_id || (!params.container_id && !params.number)) {
    return { ok: false, status: 400, error: "organization_id and (container_id or number) required" };
  }

  if (params.number) {
    const result = await syncContainerByNumber(userClient, admin, params.organization_id, params.number, {
      forceRefresh: params.force ?? false,
    });
    return {
      ok: true,
      container: result.container as Record<string, unknown>,
      refreshed: result.refreshed,
      normalized: normalizeContainerNumber(params.number),
    };
  }

  const { data: row, error } = await userClient
    .from("containers")
    .select("*")
    .eq("organization_id", params.organization_id)
    .eq("id", params.container_id!)
    .maybeSingle();

  if (error) throw error;
  if (!row) return { ok: false, status: 404, error: "Not found" };

  const stale =
    params.force ||
    !row.last_synced_at ||
    Date.now() - new Date(row.last_synced_at as string).getTime() >
      Number(Deno.env.get("CONTAINER_STALE_MS") ?? 15 * 60 * 1000);

  if (stale) {
    const result = await syncContainerByNumber(
      userClient,
      admin,
      params.organization_id,
      row.container_number as string,
      { forceRefresh: true },
    );
    return {
      ok: true,
      container: result.container as Record<string, unknown>,
      refreshed: result.refreshed,
    };
  }

  return { ok: true, container: row as Record<string, unknown>, refreshed: false };
}

// ---------------------------------------------------------------------------
// search-containers
// ---------------------------------------------------------------------------

export async function searchContainers(
  userClient: SupabaseClient,
  organizationId: string,
  query: string,
): Promise<{ ok: true; results: SearchContainerRow[] } | Err> {
  const q = query.trim();
  if (!organizationId || q.length < 2) {
    return { ok: false, status: 400, error: "organization_id and q (min 2 chars) required" };
  }

  const normalized = normalizeContainerNumber(q);
  const safe = q.replace(/%/g, "").replace(/,/g, "").slice(0, 64);

  const { data, error } = await userClient
    .from("containers")
    .select("id, container_number, normalized_number, carrier, status, last_synced_at")
    .eq("organization_id", organizationId)
    .or(`container_number.ilike.%${safe}%,normalized_number.ilike.%${normalized}%`)
    .limit(25);

  if (error) throw error;

  return { ok: true, results: (data ?? []) as SearchContainerRow[] };
}
