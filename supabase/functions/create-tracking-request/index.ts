import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createUserClient, tryCreateServiceClient } from "../_shared/supabase.ts";
import { normalizeContainerNumber } from "../_shared/normalize.ts";
import { syncContainerByNumber } from "../_shared/sync.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const admin = tryCreateServiceClient();
    const body = (await req.json()) as {
      organization_id?: string;
      container_number?: string;
      run_sync?: boolean;
      /** Set when creating from BOL import so siblings share one id. */
      shipment_group_id?: string | null;
      /** BOL number entered at import (optional). */
      source_bill_of_lading?: string | null;
      /** JSONCargo carrier enum (MAERSK, MSC, …); persisted on `shipments` and passed to container sync. */
      shipping_line?: string | null;
      /** Attach container + new tracking row to this shipment (same org). Ignored when shipment_group_id is set. */
      shipment_id?: string | null;
      /** When creating a new shipment (no shipment_group_id, no shipment_id): title; defaults to container number. */
      shipment_reference?: string | null;
    };

    if (!body.organization_id || !body.container_number?.trim()) {
      return jsonResponse(
        { error: "organization_id and container_number required" },
        { status: 400 },
      );
    }

    const normalized = normalizeContainerNumber(body.container_number);
    const bol = body.source_bill_of_lading?.trim() || null;
    const shippingLine = body.shipping_line?.trim() || null;
    const groupId =
      typeof body.shipment_group_id === "string" && body.shipment_group_id.trim()
        ? body.shipment_group_id.trim()
        : null;
    const attachShipmentId =
      !groupId &&
      typeof body.shipment_id === "string" &&
      body.shipment_id.trim()
        ? body.shipment_id.trim()
        : null;
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: orgMembership, error: memErr } = await userClient
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", body.organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (memErr) throw memErr;
    let shipmentId: string;
    if (groupId) {
      const { data: existingShip, error: findShipErr } = await userClient
        .from("shipments")
        .select("id")
        .eq("organization_id", body.organization_id)
        .eq("shipment_group_id", groupId)
        .maybeSingle();
      if (findShipErr) throw findShipErr;
      if (existingShip?.id) {
        shipmentId = existingShip.id as string;
        if (shippingLine) {
          await userClient
            .from("shipments")
            .update({ shipping_line: shippingLine })
            .eq("id", shipmentId);
        }
      } else {
        const ref = bol ?? `BOL import (${groupId.slice(0, 8)}…)`;
        const { data: ship, error: shipErr } = await userClient
          .from("shipments")
          .insert({
            organization_id: body.organization_id,
            created_by: userData.user.id,
            assignee_user_id: orgMembership?.user_id ? userData.user.id : null,
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
        .eq("organization_id", body.organization_id)
        .maybeSingle();
      if (exErr) throw exErr;
      if (!existing?.id) {
        return jsonResponse({ error: "Shipment not found in this organization" }, { status: 404 });
      }
      shipmentId = existing.id as string;
      if (shippingLine) {
        await userClient
          .from("shipments")
          .update({ shipping_line: shippingLine })
          .eq("id", shipmentId);
      }
    } else {
      const ref =
        body.shipment_reference?.trim() ||
        body.container_number.trim();
      const { data: ship, error: shipErr } = await userClient
        .from("shipments")
        .insert({
          organization_id: body.organization_id,
          created_by: userData.user.id,
          assignee_user_id: orgMembership?.user_id ? userData.user.id : null,
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
          organization_id: body.organization_id,
          shipment_id: shipmentId,
          container_number: body.container_number.trim(),
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
        organization_id: body.organization_id,
        created_by: userData.user.id,
        container_id: containerRow.id as string,
        container_number: body.container_number.trim(),
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
        await userClient
          .from("shipments")
          .update({ assignee_user_id: userData.user.id })
          .eq("id", shipmentId);
      }
      const { error: spErr } = await userClient.from("shipment_participants").insert({
        shipment_id: shipmentId,
        user_id: userData.user.id,
      });
      if (spErr && spErr.code !== "23505") {
        throw spErr;
      }
    }

    if (body.run_sync !== false) {
      await userClient
        .from("tracking_requests")
        .update({ status: "syncing" })
        .eq("id", inserted.id);

      const { data: shipForSync } = await userClient
        .from("shipments")
        .select("shipping_line")
        .eq("id", shipmentId)
        .maybeSingle();
      const syncShippingLine =
        (shipForSync?.shipping_line as string | null | undefined)?.trim() || null;

      try {
        await syncContainerByNumber(
          userClient,
          admin,
          body.organization_id,
          body.container_number.trim(),
          {
            trackingRequestId: inserted.id,
            shipmentId,
            forceRefresh: true,
            shippingLine: syncShippingLine,
          },
        );
      } catch (syncErr) {
        const syncMessage =
          syncErr instanceof Error ? syncErr.message : String(syncErr);
        await userClient
          .from("tracking_requests")
          .update({
            status: "failed",
            error_message: syncMessage,
          })
          .eq("id", inserted.id);
        const { data: afterFail } = await userClient
          .from("tracking_requests")
          .select("*")
          .eq("id", inserted.id)
          .single();
        return jsonResponse({
          tracking_request: afterFail ?? inserted,
          sync_error: syncMessage,
        });
      }
    }

    const { data: finalRow } = await userClient
      .from("tracking_requests")
      .select("*")
      .eq("id", inserted.id)
      .single();

    return jsonResponse({ tracking_request: finalRow ?? inserted });
  } catch (e) {
    const message =
      e instanceof Error
        ? e.message
        : e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : typeof e === "object"
            ? JSON.stringify(e)
            : String(e);
    return jsonResponse({ error: message }, { status: 500 });
  }
});
