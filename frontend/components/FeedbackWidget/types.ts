import type { FeedbackCategory } from "@shared/dto/feedback.dto";

export interface FeedbackWidgetContext {
  pageUrl: string;
  shipmentId: string | null;
  organizationId: string | null;
  accountKind: string | null;
}

export interface FeedbackWidgetFormState {
  category: FeedbackCategory;
  message: string;
}
