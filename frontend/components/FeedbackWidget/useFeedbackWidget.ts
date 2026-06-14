"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { feedbackWidgetCategoryAtom, feedbackWidgetOpenAtom } from "@/atoms/feedback-widget";
import { useToast } from "@/atoms/toast";
import { useOrganizationWorkspaceOptional } from "@/atoms/organization-workspace";
import { useCreateFeedbackMutation } from "@/hooks/mutations/useFeedback";
import { getBrowserAuthSession, subscribeToAuthState } from "@/services/auth.service";
import {
  FEEDBACK_MIN_MESSAGE_LENGTH,
  FEEDBACK_SUCCESS_TOAST,
} from "./constants";
import type { FeedbackWidgetFormState } from "./types";
import { buildFeedbackContext } from "./utils";

export function useFeedbackWidget() {
  const pathname = usePathname();
  const { toast } = useToast();
  const createFeedbackMutation = useCreateFeedbackMutation();
  const orgCtx = useOrganizationWorkspaceOptional();
  const selectedOrgId = orgCtx?.selectedOrgId ?? null;

  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useAtom(feedbackWidgetOpenAtom);
  const defaultCategory = useAtomValue(feedbackWidgetCategoryAtom);
  const [form, setForm] = useState<FeedbackWidgetFormState>({
    category: defaultCategory,
    message: "",
  });

  useEffect(() => {
    let cancelled = false;
    void getBrowserAuthSession().then((session) => {
      if (!cancelled) setSignedIn(Boolean(session));
    });
    const unsubscribe = subscribeToAuthState((isSignedIn) => {
      setSignedIn(isSignedIn);
      if (!isSignedIn) setOpen(false);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setForm((prev) => ({ ...prev, category: defaultCategory }));
    }
  }, [open, defaultCategory]);

  const context = buildFeedbackContext({
    pathname,
    organizationId: selectedOrgId,
  });

  const close = useCallback(() => {
    setOpen(false);
    setForm((prev) => ({ ...prev, message: "" }));
  }, [setOpen]);

  const setCategory = useCallback((category: FeedbackWidgetFormState["category"]) => {
    setForm((prev) => ({ ...prev, category }));
  }, []);

  const setMessage = useCallback((message: string) => {
    setForm((prev) => ({ ...prev, message }));
  }, []);

  const submit = useCallback(async () => {
    const trimmed = form.message.trim();
    if (trimmed.length < FEEDBACK_MIN_MESSAGE_LENGTH) return;

    try {
      await createFeedbackMutation.mutateAsync({
        category: form.category,
        message: trimmed,
        page_url: context.pageUrl,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        viewport_width: typeof window !== "undefined" ? window.innerWidth : undefined,
        viewport_height: typeof window !== "undefined" ? window.innerHeight : undefined,
        organization_id: context.organizationId,
        context: {
          shipment_id: context.shipmentId ?? undefined,
          account_kind: context.accountKind ?? undefined,
        },
      });
      toast(FEEDBACK_SUCCESS_TOAST, "success");
      close();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not send feedback", "error");
    }
  }, [form, context, createFeedbackMutation, toast, close]);

  const trimmedLength = form.message.trim().length;
  const canSubmit = trimmedLength >= FEEDBACK_MIN_MESSAGE_LENGTH && !createFeedbackMutation.isPending;

  return {
    signedIn,
    open,
    setOpen,
    close,
    form,
    setCategory,
    setMessage,
    submit,
    canSubmit,
    isSubmitting: createFeedbackMutation.isPending,
    context,
    messageTooShort: trimmedLength > 0 && trimmedLength < FEEDBACK_MIN_MESSAGE_LENGTH,
  };
}
