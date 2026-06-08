"use client";

import { MessageCircleMore } from "lucide-react";
import { ActionHoverTooltip } from "@/components/ActionHoverTooltip";
import { AutoGrowTextarea } from "@/components/AutoGrowTextarea";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import {
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_MODAL_TITLE,
  FEEDBACK_SUBMIT_LABEL,
  FEEDBACK_SUBMITTING_LABEL,
  FEEDBACK_WIDGET_FAB_CLASS,
  FEEDBACK_WIDGET_FAB_TOOLTIP_LABEL,
  FEEDBACK_WIDGET_FAB_WRAPPER_CLASS,
  FEEDBACK_WIDGET_MODAL_OVERLAY_CLASS,
  FEEDBACK_WIDGET_MODAL_PANEL_CLASS,
} from "./constants";
import { useFeedbackWidget } from "./useFeedbackWidget";
import { formatAccountKindLabel } from "./utils";

export { useFeedbackWidgetControls } from "@/atoms/feedback-widget";

export function FeedbackWidget() {
  const w = useFeedbackWidget();

  if (!w.signedIn) return null;

  const activeCategory = FEEDBACK_CATEGORY_OPTIONS.find((o) => o.value === w.form.category);

  return (
    <>
      {!w.open ? (
        <div className={FEEDBACK_WIDGET_FAB_WRAPPER_CLASS}>
          <ActionHoverTooltip
            label={FEEDBACK_WIDGET_FAB_TOOLTIP_LABEL}
            labelClassName="whitespace-nowrap"
            placement="left"
          >
            <button
              type="button"
              aria-label="Open feedback"
              className={FEEDBACK_WIDGET_FAB_CLASS}
              onClick={() => w.setOpen(true)}
            >
              <MessageCircleMore className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </ActionHoverTooltip>
        </div>
      ) : null}

      {w.open ? (
        <div className={FEEDBACK_WIDGET_MODAL_OVERLAY_CLASS}>
          <button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity dark:bg-black/70"
            onClick={w.close}
          />
          <div
            ref={w.panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={w.titleId}
            tabIndex={-1}
            className={FEEDBACK_WIDGET_MODAL_PANEL_CLASS}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2
                id={w.titleId}
                className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
              >
                {FEEDBACK_MODAL_TITLE}
              </h2>
              <DialogCloseButton onClick={w.close} />
            </div>

            <div className="space-y-4 px-5 py-4">
              <div
                role="tablist"
                aria-label="Feedback type"
                className="flex flex-wrap gap-2"
              >
                {FEEDBACK_CATEGORY_OPTIONS.map((option) => {
                  const selected = w.form.category === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      className={
                        selected
                          ? "rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }
                      onClick={() => w.setCategory(option.value)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {activeCategory ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{activeCategory.description}</p>
              ) : null}

              <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Message
                <AutoGrowTextarea
                  value={w.form.message}
                  onChange={(e) => w.setMessage(e.target.value)}
                  placeholder={activeCategory?.placeholder ?? "Share your feedback"}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  maxHeightPx={200}
                />
              </label>

              {w.messageTooShort ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Please enter at least 10 characters.
                </p>
              ) : null}

              <div className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400">
                <p>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Page:</span>{" "}
                  {w.context.pageUrl}
                </p>
                <p className="mt-1">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Account:</span>{" "}
                  {formatAccountKindLabel(w.context.accountKind)}
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={w.close}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!w.canSubmit}
                  onClick={() => void w.submit()}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {w.isSubmitting ? FEEDBACK_SUBMITTING_LABEL : FEEDBACK_SUBMIT_LABEL}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
