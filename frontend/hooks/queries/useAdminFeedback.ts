"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminFeedback } from "@/services/feedback.service";
import type { FeedbackCategory, FeedbackStatus } from "@shared/dto/feedback.dto";

export const adminFeedbackQueryKeyRoot = ["admin-feedback"] as const;

function adminFeedbackQueryKey(filters?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}) {
  return [...adminFeedbackQueryKeyRoot, filters?.category ?? "all", filters?.status ?? "all"] as const;
}

export function useAdminFeedbackQuery(filters?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}) {
  return useQuery({
    queryKey: adminFeedbackQueryKey(filters),
    queryFn: () => fetchAdminFeedback(filters),
  });
}
