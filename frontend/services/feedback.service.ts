import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch, parseEdgeJson } from "@/lib/supabase/edge-functions";
import type {
  FeedbackCategory,
  FeedbackStatus,
  SubmitFeedbackBody,
  SubmitFeedbackResponse,
  UserFeedbackRow,
} from "@shared/dto/feedback.dto";

export type { FeedbackCategory, FeedbackStatus, UserFeedbackRow };

export async function createFeedback(body: SubmitFeedbackBody): Promise<SubmitFeedbackResponse> {
  return parseEdgeJson<SubmitFeedbackResponse>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.feedback.create, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function fetchAdminFeedback(params?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}): Promise<{ rows: AdminFeedbackListRow[] }> {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.status) q.set("status", params.status);
  const suffix = q.toString() ? `?${q}` : "";
  return parseEdgeJson<{ rows: AdminFeedbackListRow[] }>(
    await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.feedback.listAdmin}${suffix}`),
  );
}

export async function updateAdminFeedbackStatus(input: {
  id: string;
  status: FeedbackStatus;
}): Promise<{ row: AdminFeedbackListRow }> {
  return parseEdgeJson<{ row: AdminFeedbackListRow }>(
    await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.feedback.updateAdmin, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export type AdminFeedbackListRow = UserFeedbackRow & {
  submitter_email: string | null;
  submitter_full_name: string | null;
  organization_name: string | null;
};
