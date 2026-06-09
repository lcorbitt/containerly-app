import type { FeedbackCategory } from "@shared/dto/feedback.dto";

export const FEEDBACK_CATEGORY_OPTIONS: {
  value: FeedbackCategory;
  label: string;
  description: string;
  placeholder: string;
}[] = [
  {
    value: "bug",
    label: "Bug Report",
    description: "Something is broken or not working as expected.",
    placeholder: "What happened? Include steps to reproduce if you can.",
  },
  {
    value: "feature",
    label: "Feature Request",
    description: "Suggest an improvement or new capability.",
    placeholder: "What would you like to see? How would it help your workflow?",
  },
  {
    value: "general",
    label: "General Feedback",
    description: "Share thoughts, questions, or other product feedback.",
    placeholder: "Tell us what is on your mind.",
  },
];

export const FEEDBACK_MODAL_TITLE = "Send Feedback";
export const FEEDBACK_SUBMIT_LABEL = "Send Feedback";
export const FEEDBACK_SUBMITTING_LABEL = "Sending…";
export const FEEDBACK_SUCCESS_TOAST = "Thanks for your feedback";
export const FEEDBACK_MIN_MESSAGE_LENGTH = 10;
