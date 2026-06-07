"use client";

import { atom, useSetAtom } from "jotai";
import { useCallback } from "react";
import type { FeedbackCategory } from "@shared/dto/feedback.dto";

export const feedbackWidgetOpenAtom = atom(false);
export const feedbackWidgetCategoryAtom = atom<FeedbackCategory>("general");

export function useFeedbackWidgetControls() {
  const setOpen = useSetAtom(feedbackWidgetOpenAtom);
  const setCategory = useSetAtom(feedbackWidgetCategoryAtom);

  const openFeedback = useCallback(
    (opts?: { category?: FeedbackCategory }) => {
      if (opts?.category) setCategory(opts.category);
      setOpen(true);
    },
    [setOpen, setCategory],
  );

  return { openFeedback };
}
