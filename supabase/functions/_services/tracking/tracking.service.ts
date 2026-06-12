import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  fetchContainerByIdInOrg,
  fetchContainerNumberById,
  searchContainersInOrg,
  upsertContainerForTrackingRequest,
} from "@models/containers.ts";
import { fetchMembershipUserIdForOrg } from "@models/organization_members.ts";
import {
  fetchShipmentAssignee,
  fetchShipmentIdByGroupId,
  fetchShipmentInOrganization,
  fetchShipmentShippingLine,
  insertShipment,
  updateShipmentAssigneeIfUnset,
  updateShipmentShippingLine,
} from "@models/shipments.ts";
import { insertShipmentParticipant } from "@models/shipment_participants.ts";
import {
  fetchTrackingRequestById,
  fetchTrackingRequestNormalizedById,
  fetchTrackingRequestWithContainerShipment,
  insertTrackingRequest,
  updateTrackingRequestStatus,
} from "@models/tracking_requests.ts";
import { normalizeContainerNumber } from "@services/container-number.ts";
import { insertShipmentActivityEvent } from "@models/shipment_activity_events.ts";
import { notifyOperatorsTrackingSyncFailed } from "@services/notification/workflow.service.ts";
import { notifyForShipmentActivityEvent } from "@services/shipment/activity/notifications.service.ts";
import { resolveShippingLineForTrackingRequest, syncContainerByNumber } from "@services/tracking/sync.ts";
import { recordShipmentCreated } from "@services/shipment/document.service.ts";
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

  const { data: orgMembership, error: memErr } = await fetchMembershipUserIdForOrg(
    userClient,
    input.organization_id,
    userId,
  );
  if (memErr) throw memErr;

  let shipmentId: string;
  if (groupId) {
    const { data: existingShip, error: findShipErr } = await fetchShipmentIdByGroupId(
      userClient,
      input.organization_id,
      groupId,
    );
    if (findShipErr) throw findShipErr;
    if (existingShip?.id) {
      shipmentId = existingShip.id as string;
      if (shippingLine) {
        await updateShipmentShippingLine(userClient, shipmentId, shippingLine);
      }
    } else {
      const containerNum = input.container_number.trim();
      const booking = bol ?? `BOL-${groupId.slice(0, 8)}`;
      const { data: ship, error: shipErr } = await insertShipment(userClient, {
        organization_id: input.organization_id,
        created_by: userId,
        assignee_user_id: orgMembership?.user_id ? userId : null,
        order_number: booking,
        carrier_booking_number: booking,
        container_number: containerNum,
        bill_of_lading: bol,
        shipment_group_id: groupId,
        ...(shippingLine ? { shipping_line: shippingLine } : {}),
      });
      if (shipErr) throw shipErr;
      if (!ship?.id) throw new Error("Could not create shipment for BOL batch");
      shipmentId = ship.id as string;
      await recordShipmentCreated(userClient, input.organization_id, shipmentId, userId, {
        order_number: booking,
        container_number: containerNum,
        bill_of_lading: bol,
        shipment_group_id: groupId,
      });
    }
  } else if (attachShipmentId) {
    const { data: existing, error: exErr } = await fetchShipmentInOrganization(
      userClient,
      attachShipmentId,
      input.organization_id,
    );
    if (exErr) throw exErr;
    if (!existing?.id) return { ok: false, status: 404, error: "Shipment not found in this organization" };
    shipmentId = existing.id as string;
    if (shippingLine) {
      await updateShipmentShippingLine(userClient, shipmentId, shippingLine);
    }
  } else {
    const containerNum = input.container_number.trim();
    const orderNum = input.shipment_order_number?.trim() || containerNum;
    const booking = bol ?? orderNum;
    const { data: ship, error: shipErr } = await insertShipment(userClient, {
      organization_id: input.organization_id,
      created_by: userId,
      assignee_user_id: orgMembership?.user_id ? userId : null,
      order_number: orderNum,
      carrier_booking_number: booking,
      container_number: containerNum,
      bill_of_lading: bol,
      ...(shippingLine ? { shipping_line: shippingLine } : {}),
    });
    if (shipErr) throw shipErr;
    if (!ship?.id) throw new Error("Could not create shipment");
    shipmentId = ship.id as string;
    await recordShipmentCreated(userClient, input.organization_id, shipmentId, userId, {
      order_number: orderNum,
      container_number: containerNum,
      carrier_booking_number: booking,
      bill_of_lading: bol,
    });
  }

  const { data: containerRow, error: contErr } = await upsertContainerForTrackingRequest(userClient, {
    organization_id: input.organization_id,
    shipment_id: shipmentId,
    container_number: input.container_number.trim(),
    normalized_number: normalized,
  });
  if (contErr) throw contErr;
  if (!containerRow?.id) throw new Error("Could not upsert container for shipment");

  const { data: inserted, error: insErr } = await insertTrackingRequest(userClient, {
    organization_id: input.organization_id,
    created_by: userId,
    container_id: containerRow.id as string,
    container_number: input.container_number.trim(),
    normalized_number: normalized,
    status: "pending",
    next_check_at: new Date().toISOString(),
    ...(bol ? { source_bill_of_lading: bol } : {}),
    ...(groupId ? { shipment_group_id: groupId } : {}),
  });
  if (insErr) throw insErr;
  if (!inserted) throw new Error("Could not insert tracking request");

  if (orgMembership?.user_id) {
    const { data: shipRow } = await fetchShipmentAssignee(userClient, shipmentId);
    if (shipRow && (shipRow as { assignee_user_id: string | null }).assignee_user_id == null) {
      await updateShipmentAssigneeIfUnset(userClient, shipmentId, userId);
    }
    const { error: spErr } = await insertShipmentParticipant(userClient, shipmentId, userId);
    if (spErr && spErr.code !== "23505") throw spErr;
  }

  const notifyClient = admin ?? userClient;

  if (input.run_sync !== false) {
    await updateTrackingRequestStatus(userClient, inserted.id as string, { status: "syncing" });
    const { data: shipForSync } = await fetchShipmentShippingLine(userClient, shipmentId);
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
      await updateTrackingRequestStatus(userClient, inserted.id as string, {
        status: "failed",
        error_message: syncMessage,
      });
      try {
        await notifyOperatorsTrackingSyncFailed(notifyClient, {
          organizationId: input.organization_id,
          shipmentId,
          containerNumber: input.container_number.trim(),
          errorMessage: syncMessage,
        });
      } catch {
        /* best-effort */
      }
      const { data: afterFail } = await fetchTrackingRequestById(userClient, inserted.id as string);
      return {
        ok: true,
        tracking_request: (afterFail ?? inserted) as Record<string, unknown>,
        shipment_id: shipmentId,
        sync_error: syncMessage,
      };
    }
  }

  const skipPerContainerLinkedAlert = Boolean(groupId && bol);
  if (!skipPerContainerLinkedAlert) {
    const containerNumber = input.container_number.trim();
    const trackingLinkedMetadata = { container_number: containerNumber };
    try {
      await insertShipmentActivityEvent(userClient, {
        shipment_id: shipmentId,
        event_type: "tracking_linked",
        body: `Carrier tracking linked for container ${containerNumber}`,
        actor_kind: "operator",
        actor_user_id: userId,
        metadata: trackingLinkedMetadata,
      });
      await notifyForShipmentActivityEvent({
        client: notifyClient,
        organizationId: input.organization_id,
        shipmentId,
        actorUserId: userId,
        eventType: "tracking_linked",
        metadata: trackingLinkedMetadata,
      });
    } catch {
      /* best-effort */
    }
  }

  const { data: finalRow } = await fetchTrackingRequestById(userClient, inserted.id as string);

  return {
    ok: true,
    tracking_request: (finalRow ?? inserted) as Record<string, unknown>,
    shipment_id: shipmentId,
  };
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
    const { data: row, error } = await fetchContainerNumberById(
      userClient,
      input.organization_id,
      input.container_id,
    );
    if (error) throw error;
    if (!row) return { ok: false, status: 404, error: "Container not found" };
    number = row.container_number as string;
  }

  if (!number) return { ok: false, status: 400, error: "container_number or container_id required" };

  if (input.tracking_request_id) {
    const { data: tr, error: trErr } = await fetchTrackingRequestNormalizedById(
      userClient,
      input.organization_id,
      input.tracking_request_id,
    );
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
    const { data: trWithC } = await fetchTrackingRequestWithContainerShipment(
      userClient,
      input.organization_id,
      input.tracking_request_id,
    );
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

  const { data: row, error } = await fetchContainerByIdInOrg(
    userClient,
    params.organization_id,
    params.container_id!,
  );

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

  const { data, error } = await searchContainersInOrg(userClient, organizationId, safe, normalized);

  if (error) throw error;

  return { ok: true, results: (data ?? []) as SearchContainerRow[] };
}
