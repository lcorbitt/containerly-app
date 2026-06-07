import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto";

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const CATEGORY_FILTER_OPTIONS: { value: FeedbackCategory | ""; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "general", label: "General Feedback" },
];

export const STATUS_FILTER_OPTIONS: { value: FeedbackStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "wont_fix", label: "Won't Fix" },
];

export const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "wont_fix", label: "Won't Fix" },
];

export const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  general: "General Feedback",
};
