"use client";

import { FeedbackWidget } from "./index";

/** Global feedback FAB + modal for signed-in users. Mounted from AppProviders. */
export function FeedbackWidgetHost({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FeedbackWidget />
    </>
  );
}
