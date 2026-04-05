import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_BODY = 4000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    const uid = userData.user.id;

    const body = (await req.json()) as {
      shipment_id?: string;
      container_id?: string;
      body?: string;
      author_display_name?: string;
      parent_message_id?: string | null;
    };

    const shipmentId = body.shipment_id?.trim() ?? "";
    const containerId = body.container_id?.trim() ?? "";
    const text = body.body?.trim() ?? "";
    const name = body.author_display_name?.trim().slice(0, 120) ?? null;
    const parentRaw = body.parent_message_id?.trim() ?? "";
    const parentId = parentRaw && UUID_RE.test(parentRaw) ? parentRaw : null;
    const shipmentScoped = !containerId;

    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }
    if (!shipmentScoped && (!containerId || !UUID_RE.test(containerId))) {
      return jsonResponse({ error: "Invalid container_id" }, { status: 400 });
    }
    if (!text || text.length > MAX_BODY) {
      return jsonResponse({ error: "Message body required (max 4000 chars)" }, { status: 400 });
    }

    const { data: access, error: accErr } = await userClient
      .from("shipment_customer_access")
      .select("id, organization_id")
      .eq("shipment_id", shipmentId)
      .eq("customer_user_id", uid)
      .is("revoked_at", null)
      .maybeSingle();

    if (accErr) {
      return jsonResponse({ error: accErr.message }, { status: 500 });
    }
    if (!access) {
      return jsonResponse({ error: "No access to this shipment" }, { status: 403 });
    }

    if (!shipmentScoped) {
      const { data: cont, error: cErr } = await userClient
        .from("containers")
        .select("id, shipment_id")
        .eq("id", containerId)
        .maybeSingle();

      if (cErr || !cont || (cont.shipment_id as string) !== shipmentId) {
        return jsonResponse({ error: "container_id is not on this shipment" }, { status: 400 });
      }
    }

    const admin = createServiceClient();

    if (parentId) {
      const { data: parent, error: parentErr } = await admin
        .from("report_messages")
        .select("id, container_id, shipment_id, is_internal")
        .eq("id", parentId)
        .maybeSingle();

      if (parentErr) throw parentErr;
      if (!parent) {
        return jsonResponse({ error: "Invalid parent message" }, { status: 400 });
      }
      if (shipmentScoped) {
        if ((parent.shipment_id as string | null) !== shipmentId || parent.container_id != null) {
          return jsonResponse({ error: "Invalid parent message" }, { status: 400 });
        }
      } else {
        if ((parent.container_id as string) !== containerId) {
          return jsonResponse({ error: "Invalid parent message" }, { status: 400 });
        }
      }
      if (parent.is_internal === true) {
        return jsonResponse({ error: "Cannot reply to an internal message" }, { status: 400 });
      }
    }

    const insertRow = shipmentScoped
      ? {
          shipment_id: shipmentId,
          container_id: null as string | null,
          author_kind: "customer" as const,
          author_user_id: uid,
          is_internal: false,
          author_display_name: name,
          body: text,
          parent_message_id: parentId,
        }
      : {
          container_id: containerId,
          shipment_id: null as string | null,
          author_kind: "customer" as const,
          author_user_id: uid,
          is_internal: false,
          author_display_name: name,
          body: text,
          parent_message_id: parentId,
        };

    const { data: inserted, error: insErr } = await admin
      .from("report_messages")
      .insert(insertRow)
      .select("id, body, author_display_name, created_at, author_kind")
      .single();

    if (insErr) throw insErr;

    await admin.from("report_activity").insert({
      shipment_id: shipmentId,
      container_id: shipmentScoped ? null : containerId,
      shared_report_id: null,
      shipment_customer_access_id: access.id as string,
      actor_user_id: uid,
      action: "customer_message",
      metadata: { message_id: inserted.id },
    });

    return jsonResponse({ message: inserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
