import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto.ts";

const FEEDBACK_SELECT =
  "id, user_id, organization_id, category, message, status, page_url, user_agent, viewport_width, viewport_height, context, created_at, updated_at";

export type InsertUserFeedbackRow = {
  user_id: string;
  organization_id?: string | null;
  category: FeedbackCategory;
  message: string;
  page_url: string;
  user_agent?: string | null;
  viewport_width?: number | null;
  viewport_height?: number | null;
  context?: Record<string, unknown>;
};

/** `user_feedback` — authenticated user submission. */
export async function insertUserFeedback(client: SupabaseClient, row: InsertUserFeedbackRow) {
  return client
    .from("user_feedback")
    .insert(row)
    .select("id")
    .single();
}

/** `user_feedback` — superadmin list (newest first). */
export function queryUserFeedbackForAdmin(
  client: SupabaseClient,
  opts?: { category?: FeedbackCategory; status?: FeedbackStatus; limit?: number },
) {
  let q = client
    .from("user_feedback")
    .select(FEEDBACK_SELECT)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.status) q = q.eq("status", opts.status);
  return q;
}

/** `user_feedback` — superadmin status update. */
export async function updateUserFeedbackStatus(
  client: SupabaseClient,
  id: string,
  status: FeedbackStatus,
) {
  return client
    .from("user_feedback")
    .update({ status })
    .eq("id", id)
    .select(FEEDBACK_SELECT)
    .single();
}
