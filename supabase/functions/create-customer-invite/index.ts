import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { DEFAULT_CUSTOMER_VISIBILITY } from "../_shared/publicReport.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomTokenHex(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

    const body = (await req.json()) as {
      organization_id?: string;
      shipment_id?: string;
      invited_email?: string;
      visibility_settings?: Record<string, unknown>;
    };

    const orgId = body.organization_id?.trim() ?? "";
    const shipmentId = body.shipment_id?.trim() ?? "";
    const emailRaw = body.invited_email?.trim().toLowerCase() ?? "";

    if (!orgId || !UUID_RE.test(orgId)) {
      return jsonResponse({ error: "Invalid organization_id" }, { status: 400 });
    }
    if (!shipmentId || !UUID_RE.test(shipmentId)) {
      return jsonResponse({ error: "Invalid shipment_id" }, { status: 400 });
    }
    if (!emailRaw || !emailRaw.includes("@")) {
      return jsonResponse({ error: "Valid invited_email required" }, { status: 400 });
    }

    const { data: row, error: shErr } = await userClient
      .from("shipments")
      .select("id, organization_id")
      .eq("id", shipmentId)
      .maybeSingle();

    if (shErr || !row) {
      return jsonResponse({ error: "Shipment not found" }, { status: 404 });
    }
    if ((row.organization_id as string) !== orgId) {
      return jsonResponse({ error: "Shipment does not belong to organization" }, { status: 400 });
    }

    const token = randomTokenHex(32);
    const tokenHash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const visibility = {
      ...DEFAULT_CUSTOMER_VISIBILITY,
      ...(body.visibility_settings && typeof body.visibility_settings === "object"
        ? body.visibility_settings
        : {}),
    };

    const admin = createServiceClient();
    const { data: invite, error: insErr } = await admin
      .from("customer_invites")
      .insert({
        organization_id: orgId,
        shipment_id: shipmentId,
        invited_email: emailRaw,
        invited_by_user_id: userData.user.id,
        token_hash: tokenHash,
        status: "pending",
        expires_at: expiresAt,
        visibility_settings: visibility,
      })
      .select("id, expires_at, created_at")
      .single();

    if (insErr) throw insErr;

    await admin.from("report_activity").insert({
      shipment_id: shipmentId,
      shared_report_id: null,
      actor_user_id: userData.user.id,
      action: "customer_invite_created",
      metadata: { invite_id: invite.id, invited_email: emailRaw, visibility_settings: visibility },
    });

    const siteUrl = Deno.env.get("PUBLIC_SITE_URL")?.replace(/\/$/, "") ?? "";
    const invitePath = `/invite/accept?token=${encodeURIComponent(token)}`;
    const invite_url = siteUrl ? `${siteUrl}${invitePath}` : invitePath;

    return jsonResponse({
      invite_id: invite.id,
      invite_url,
      expires_at: invite.expires_at,
      token,
      visibility_settings: visibility,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
