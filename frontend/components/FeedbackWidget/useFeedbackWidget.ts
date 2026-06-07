"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { feedbackWidgetCategoryAtom, feedbackWidgetOpenAtom } from "@/atoms/feedback-widget";
import { useToast } from "@/contexts/toast";
import { OrganizationWorkspaceContext } from "@/contexts/organization-workspace";
import { useSubmitFeedbackMutation } from "@/hooks/mutations/useSubmitFeedback";
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
  const submitMutation = useSubmitFeedbackMutation();
  const orgCtx = useContext(OrganizationWorkspaceContext);
  const selectedOrgId = orgCtx?.selectedOrgId ?? null;

  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useAtom(feedbackWidgetOpenAtom);
  const defaultCategory = useAtomValue(feedbackWidgetCategoryAtom);
  const [form, setForm] = useState<FeedbackWidgetFormState>({
    category: defaultCategory,
    message: "",
  });
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

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
      await submitMutation.mutateAsync({
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
  }, [form, context, submitMutation, toast, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const trimmedLength = form.message.trim().length;
  const canSubmit = trimmedLength >= FEEDBACK_MIN_MESSAGE_LENGTH && !submitMutation.isPending;

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
    isSubmitting: submitMutation.isPending,
    context,
    titleId,
    panelRef,
    messageTooShort: trimmedLength > 0 && trimmedLength < FEEDBACK_MIN_MESSAGE_LENGTH,
  };
}
