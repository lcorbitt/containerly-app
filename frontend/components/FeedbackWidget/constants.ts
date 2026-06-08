import type { FeedbackCategory } from "@shared/dto/feedback.dto";

/** Fixed-position anchor for the FAB (also the tooltip trigger wrapper, so the tooltip aligns to the button). */
export const FEEDBACK_WIDGET_FAB_WRAPPER_CLASS = "fixed bottom-6 right-6 z-[90]";

export const FEEDBACK_WIDGET_FAB_CLASS =
  "flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-lg transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

export const FEEDBACK_WIDGET_FAB_TOOLTIP_LABEL = "Send Feedback";

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
