import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFeedback, updateAdminFeedbackStatus } from "@/services/feedback.service";
import { feedbackQueryKeyRoot } from "@/hooks/queries/useFeedback";
import type { FeedbackStatus, SubmitFeedbackBody } from "@shared/dto/feedback.dto";

export function useCreateFeedbackMutation() {
  return useMutation({
    mutationFn: (body: SubmitFeedbackBody) => createFeedback(body),
  });
}

export function useUpdateAdminFeedbackStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: FeedbackStatus }) => updateAdminFeedbackStatus(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedbackQueryKeyRoot });
    },
  });
}
