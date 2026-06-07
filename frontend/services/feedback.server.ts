import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto";
import type { AdminFeedbackListRow } from "@/services/feedback.service";

type ProfileJoin = { email: string | null; full_name: string | null };
type OrgJoin = { name: string | null };

type FeedbackDbRow = {
  id: string;
  user_id: string;
  organization_id: string | null;
  category: FeedbackCategory;
  message: string;
  status: FeedbackStatus;
  page_url: string;
  user_agent: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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

export async function fetchAdminFeedbackRows(
  supabase: SupabaseClient,
  filters?: { category?: FeedbackCategory; status?: FeedbackStatus },
): Promise<AdminFeedbackListRow[]> {
  let q = supabase
    .from("user_feedback")
    .select(
      "id, user_id, organization_id, category, message, status, page_url, user_agent, viewport_width, viewport_height, context, created_at, updated_at, profiles(email, full_name), organizations(name)",
    )
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
    .select(
      "id, user_id, organization_id, category, message, status, page_url, user_agent, viewport_width, viewport_height, context, created_at, updated_at, profiles(email, full_name), organizations(name)",
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Feedback row not found");
  }

  return mapFeedbackRow(data as unknown as FeedbackDbRow);
}
