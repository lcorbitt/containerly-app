import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { DEFAULT_CUSTOMER_VISIBILITY } from "../_shared/publicReport.ts";
import { createServiceClient, createUserClient } from "../_shared/supabase.ts";

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const REMINDER_DAYS = 14;

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
    const userEmail = (userData.user.email ?? "").trim().toLowerCase();

    const body = (await req.json()) as { token?: string };
    const token = body.token?.trim() ?? "";
    if (!token) {
      return jsonResponse({ error: "token required" }, { status: 400 });
    }

    const tokenHash = await sha256Hex(token);
    const admin = createServiceClient();

    const { data: invite, error: invErr } = await admin
      .from("customer_invites")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (invErr) throw invErr;
    if (!invite) {
      return jsonResponse({ error: "Invalid or expired invite" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return jsonResponse(
        { error: invite.status === "accepted" ? "Invite already accepted" : "Invite is no longer valid" },
        { status: 409 },
      );
    }

    if (new Date(invite.expires_at as string) < new Date()) {
      await admin.from("customer_invites").update({ status: "expired" }).eq("id", invite.id);
      return jsonResponse({ error: "This invite has expired" }, { status: 410 });
    }

    const invitedEmail = String(invite.invited_email).trim().toLowerCase();
    if (userEmail !== invitedEmail) {
      return jsonResponse(
        {
          error: "Signed-in email does not match the invitation. Sign in with the invited address.",
          expected_email_hint: invitedEmail.replace(/(^.).*(@.*$)/, "$1***$2"),
        },
        { status: 403 },
      );
    }

    const shipmentId = invite.shipment_id as string;
    const orgId = invite.organization_id as string;

    const { data: existing } = await admin
      .from("shipment_customer_access")
      .select("id")
      .eq("shipment_id", shipmentId)
      .eq("customer_user_id", uid)
      .is("revoked_at", null)
      .maybeSingle();

    if (existing) {
      await admin
        .from("customer_invites")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: uid,
        })
        .eq("id", invite.id);

      return jsonResponse({
        already_had_access: true,
        shipment_id: shipmentId,
        shipment_access_id: existing.id,
      });
    }

    const vis = invite.visibility_settings as Record<string, unknown> | null | undefined;
    const visibility_settings = {
      ...DEFAULT_CUSTOMER_VISIBILITY,
      ...(vis && typeof vis === "object" && !Array.isArray(vis) ? vis : {}),
    };

    const reminderDue = new Date(Date.now() + REMINDER_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: access, error: accErr } = await admin
      .from("shipment_customer_access")
      .insert({
        organization_id: orgId,
        shipment_id: shipmentId,
        customer_user_id: uid,
        invite_id: invite.id as string,
        visibility_settings,
        configuration_reminder_due_at: reminderDue,
      })
      .select("id")
      .single();

    if (accErr) throw accErr;

    await admin
      .from("customer_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: uid,
      })
      .eq("id", invite.id);

    await admin.from("report_activity").insert({
      shipment_id: shipmentId,
      shared_report_id: null,
      shipment_customer_access_id: access.id as string,
      actor_user_id: uid,
      action: "customer_invite_accepted",
      metadata: { invite_id: invite.id },
    });

    const { count: memberCount } = await admin
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);

    if ((memberCount ?? 0) === 0) {
      await admin.from("profiles").update({ account_kind: "customer" }).eq("id", uid);
    }

    return jsonResponse({
      shipment_id: shipmentId,
      shipment_access_id: access.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("Missing Supabase env") || message.includes("Authorization")) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
});
