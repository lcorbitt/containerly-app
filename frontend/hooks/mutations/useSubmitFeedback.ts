import { useMutation } from "@tanstack/react-query";
import { submitFeedback } from "@/services/feedback.service";
import type { SubmitFeedbackBody } from "@shared/dto/feedback.dto";

export function useSubmitFeedbackMutation() {
  return useMutation({
    mutationFn: (body: SubmitFeedbackBody) => submitFeedback(body),
  });
}
