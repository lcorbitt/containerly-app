import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch } from "@/lib/supabase/edge-functions";
import type {
  FeedbackCategory,
  FeedbackStatus,
  SubmitFeedbackBody,
  SubmitFeedbackResponse,
  UserFeedbackRow,
} from "@shared/dto/feedback.dto";
import { apiJson } from "@/utils/api-client";

export type { FeedbackCategory, FeedbackStatus, UserFeedbackRow };

export async function submitFeedback(body: SubmitFeedbackBody): Promise<SubmitFeedbackResponse> {
  const result = await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.feedback.submit, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  if (!result.res.ok) {
    let message = result.res.statusText;
    try {
      const parsed = JSON.parse(result.text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (result.text) message = result.text;
    }
    throw new Error(message);
  }

  return JSON.parse(result.text) as SubmitFeedbackResponse;
}

export async function fetchAdminFeedback(params?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}): Promise<{ rows: AdminFeedbackListRow[] }> {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.status) q.set("status", params.status);
  const suffix = q.toString() ? `?${q}` : "";
  return apiJson<{ rows: AdminFeedbackListRow[] }>(`/api/admin/feedback${suffix}`);
}

export async function updateAdminFeedbackStatus(input: {
  id: string;
  status: FeedbackStatus;
}): Promise<{ row: AdminFeedbackListRow }> {
  return apiJson<{ row: AdminFeedbackListRow }>("/api/admin/feedback", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export type AdminFeedbackListRow = UserFeedbackRow & {
  submitter_email: string | null;
  submitter_full_name: string | null;
  organization_name: string | null;
};
