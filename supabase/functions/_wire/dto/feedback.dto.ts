/** create-feedback Edge function contract. */

export type FeedbackCategory = "bug" | "feature" | "general";

export type FeedbackStatus = "new" | "reviewed" | "resolved" | "wont_fix";

export type SubmitFeedbackBody = {
  category: FeedbackCategory;
  message: string;
  page_url: string;
  user_agent?: string;
  viewport_width?: number;
  viewport_height?: number;
  organization_id?: string | null;
  context?: {
    shipment_id?: string;
    account_kind?: string;
  };
};

export type SubmitFeedbackResponse = {
  id: string;
};

export type UserFeedbackRow = {
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
};

export type UpdateFeedbackStatusBody = {
  id: string;
  status: FeedbackStatus;
};
