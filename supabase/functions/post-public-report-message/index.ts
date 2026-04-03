import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/supabase.ts";

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
    const body = (await req.json()) as {
      report_id?: string;
      body?: string;
      author_display_name?: string;
      parent_message_id?: string | null;
    };

    const reportId = body.report_id?.trim() ?? "";
    const text = body.body?.trim() ?? "";
    const name = body.author_display_name?.trim().slice(0, 120) ?? null;
    const parentRaw = body.parent_message_id?.trim() ?? "";
    const parentId = parentRaw && UUID_RE.test(parentRaw) ? parentRaw : null;

    if (!reportId || !UUID_RE.test(reportId)) {
      return jsonResponse({ error: "Invalid report_id" }, { status: 400 });
    }
    if (!text || text.length > MAX_BODY) {
      return jsonResponse({ error: "Message body required (max 4000 chars)" }, { status: 400 });
    }

    const admin = createServiceClient();

    const { data: share, error: shareErr } = await admin
      .from("shared_reports")
      .select("id, tracking_request_id, revoked_at, expires_at")
      .eq("id", reportId)
      .maybeSingle();

    if (shareErr) throw shareErr;
    if (!share) {
      return jsonResponse({ error: "Report not found" }, { status: 404 });
    }
    if (share.revoked_at) {
      return jsonResponse({ error: "This report link is no longer active" }, { status: 410 });
    }
    if (share.expires_at && new Date(share.expires_at as string) < new Date()) {
      return jsonResponse({ error: "This report link has expired" }, { status: 410 });
    }

    const trId = share.tracking_request_id as string;

    if (parentId) {
      const { data: parent, error: parentErr } = await admin
        .from("report_messages")
        .select("id, tracking_request_id, is_internal")
        .eq("id", parentId)
        .maybeSingle();

      if (parentErr) throw parentErr;
      if (!parent || (parent.tracking_request_id as string) !== trId) {
        return jsonResponse({ error: "Invalid parent message" }, { status: 400 });
      }
      if (parent.is_internal === true) {
        return jsonResponse({ error: "Cannot reply to an internal message" }, { status: 400 });
      }
    }

    const { data: inserted, error: insErr } = await admin
      .from("report_messages")
      .insert({
        tracking_request_id: trId,
        author_kind: "customer",
        author_user_id: null,
        is_internal: false,
        author_display_name: name,
        body: text,
        parent_message_id: parentId,
      })
      .select("id, body, author_display_name, created_at, author_kind")
      .single();

    if (insErr) throw insErr;

    await admin.from("report_activity").insert({
      tracking_request_id: share.tracking_request_id as string,
      shared_report_id: reportId,
      actor_user_id: null,
      action: "customer_message",
      metadata: { message_id: inserted.id },
    });

    return jsonResponse({ message: inserted });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, { status: 500 });
  }
});
