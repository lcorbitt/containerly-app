import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAdminFeedbackStatus } from "@/services/feedback.service";
import { adminFeedbackQueryKeyRoot } from "@/hooks/queries/useAdminFeedback";
import type { FeedbackStatus } from "@shared/dto/feedback.dto";

export function useUpdateAdminFeedbackStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: FeedbackStatus }) => updateAdminFeedbackStatus(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminFeedbackQueryKeyRoot });
    },
  });
}
