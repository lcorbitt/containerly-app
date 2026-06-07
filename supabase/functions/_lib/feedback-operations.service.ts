import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { notifyFeedbackSubmitted } from "@supabase-shared/feedback-notifications.service.ts";
import { insertUserFeedback } from "@models/user_feedback.ts";
import { fetchProfileEmailByUserId } from "@models/profiles.ts";
import type { SubmitFeedbackBody } from "@shared/dto/feedback.dto.ts";

const VALID_CATEGORIES = new Set(["bug", "feature", "general"]);

export function validateSubmitFeedbackBody(body: SubmitFeedbackBody): string | null {
  if (!VALID_CATEGORIES.has(body.category)) {
    return "Invalid category";
  }
  const message = body.message?.trim() ?? "";
  if (message.length < 10) {
    return "Message must be at least 10 characters";
  }
  const pageUrl = body.page_url?.trim() ?? "";
  if (!pageUrl) {
    return "page_url is required";
  }
  return null;
}

export async function submitUserFeedback(
  client: SupabaseClient,
  userId: string,
  body: SubmitFeedbackBody,
): Promise<{ ok: true; id: string } | { ok: false; error: string; status: number }> {
  const validationError = validateSubmitFeedbackBody(body);
  if (validationError) {
    return { ok: false, error: validationError, status: 400 };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("email, account_kind")
    .eq("id", userId)
    .maybeSingle();

  const context = {
    ...(body.context ?? {}),
    account_kind: body.context?.account_kind ?? profile?.account_kind ?? null,
  };

  const { data, error } = await insertUserFeedback(client, {
    user_id: userId,
    organization_id: body.organization_id ?? null,
    category: body.category,
    message: body.message.trim(),
    page_url: body.page_url.trim(),
    user_agent: body.user_agent ?? null,
    viewport_width: body.viewport_width ?? null,
    viewport_height: body.viewport_height ?? null,
    context,
  });

  if (error || !data?.id) {
    return { ok: false, error: error?.message ?? "Failed to save feedback", status: 500 };
  }

  const emailRow = profile?.email
    ? { email: profile.email as string | null }
    : (await fetchProfileEmailByUserId(client, userId)).data;

  void notifyFeedbackSubmitted({
    id: data.id as string,
    category: body.category,
    message: body.message.trim(),
    pageUrl: body.page_url.trim(),
    submitterEmail: (emailRow?.email as string | null | undefined) ?? null,
    accountKind: (profile?.account_kind as string | null | undefined) ?? null,
    organizationId: body.organization_id ?? null,
  }).catch((e) => console.error("[feedback] notification error", e));

  return { ok: true, id: data.id as string };
}
