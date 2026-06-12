import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyFeedbackSubmitted } from "@supabase-shared/feedback-notifications.service.ts";
import { insertUserFeedback } from "@models/user_feedback.ts";
import { fetchProfileEmailByUserId } from "@models/profiles.ts";
import type {
  FeedbackCategory,
  FeedbackStatus,
  SubmitFeedbackBody,
  UserFeedbackRow,
} from "@shared/dto/feedback.dto.ts";

export type AdminFeedbackListRow = UserFeedbackRow & {
  submitter_email: string | null;
  submitter_full_name: string | null;
  organization_name: string | null;
};

type ProfileJoin = { email: string | null; full_name: string | null };
type OrgJoin = { name: string | null };

type FeedbackDbRow = UserFeedbackRow & {
  profiles: ProfileJoin | ProfileJoin[] | null;
  organizations: OrgJoin | OrgJoin[] | null;
};

function firstJoin<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapFeedbackRow(row: FeedbackDbRow): AdminFeedbackListRow {
  const profile = firstJoin(row.profiles);
  const organization = firstJoin(row.organizations);

  return {
    id: row.id,
    user_id: row.user_id,
    organization_id: row.organization_id,
    category: row.category,
    message: row.message,
    status: row.status,
    page_url: row.page_url,
    user_agent: row.user_agent,
    viewport_width: row.viewport_width,
    viewport_height: row.viewport_height,
    context: row.context ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    submitter_email: profile?.email ?? null,
    submitter_full_name: profile?.full_name ?? null,
    organization_name: organization?.name ?? null,
  };
}

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

const ADMIN_FEEDBACK_SELECT =
  "id, user_id, organization_id, category, message, status, page_url, user_agent, viewport_width, viewport_height, context, created_at, updated_at, profiles(email, full_name), organizations(name)";

export async function fetchAdminFeedbackRows(
  supabase: SupabaseClient,
  filters?: { category?: FeedbackCategory; status?: FeedbackStatus },
): Promise<AdminFeedbackListRow[]> {
  let q = supabase
    .from("user_feedback")
    .select(ADMIN_FEEDBACK_SELECT)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as FeedbackDbRow[]).map(mapFeedbackRow);
}

export async function updateAdminFeedbackStatus(
  supabase: SupabaseClient,
  input: { id: string; status: FeedbackStatus },
): Promise<AdminFeedbackListRow> {
  const { data, error } = await supabase
    .from("user_feedback")
    .update({ status: input.status })
    .eq("id", input.id)
    .select(ADMIN_FEEDBACK_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Feedback row not found");
  }

  return mapFeedbackRow(data as unknown as FeedbackDbRow);
}
