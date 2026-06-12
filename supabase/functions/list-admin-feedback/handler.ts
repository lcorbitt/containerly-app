import { requireAuthUserId, requireSuperadmin } from "@supabase-shared/auth.ts";
import { fetchAdminFeedbackRows } from "@supabase-shared/feedback-operations.service.ts";
import { createUserClient } from "@supabase-shared/db.ts";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@supabase-shared/utils.ts";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto.ts";

const VALID_CATEGORIES = new Set<FeedbackCategory>(["bug", "feature", "general"]);
const VALID_STATUSES = new Set<FeedbackStatus>(["new", "reviewed", "resolved", "wont_fix"]);

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    const superadmin = await requireSuperadmin(userClient, auth.userId);
    if (!superadmin.ok) return superadmin.response;

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const status = url.searchParams.get("status");

    const filters: { category?: FeedbackCategory; status?: FeedbackStatus } = {};
    if (category && VALID_CATEGORIES.has(category as FeedbackCategory)) {
      filters.category = category as FeedbackCategory;
    }
    if (status && VALID_STATUSES.has(status as FeedbackStatus)) {
      filters.status = status as FeedbackStatus;
    }

    const rows = await fetchAdminFeedbackRows(userClient, filters);
    return jsonResponse({ rows });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 500 });
  }
}
