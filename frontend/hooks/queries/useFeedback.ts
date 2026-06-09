"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminFeedback } from "@/services/feedback.service";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto";

export const feedbackQueryKeyRoot = ["feedback"] as const;

function feedbackQueryKey(filters?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}) {
  return [...feedbackQueryKeyRoot, filters?.category ?? "all", filters?.status ?? "all"] as const;
}

export function useAdminFeedbackQuery(filters?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}) {
  return useQuery({
    queryKey: feedbackQueryKey(filters),
    queryFn: () => fetchAdminFeedback(filters),
  });
}
