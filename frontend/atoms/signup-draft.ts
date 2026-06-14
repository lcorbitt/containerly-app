"use client";

import { atom, useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import type { SignupDraft } from "@/app/(marketing)/signup/components/SignupWizard/types";
import {
  clearStoredSignupDraft,
  emptySignupDraft,
  writeStoredSignupDraft,
} from "@/app/(marketing)/signup/components/SignupWizard/utils";

export const signupDraftAtom = atom<SignupDraft>(emptySignupDraft());
export const signupOrgImageFileAtom = atom<File | null>(null);

export function useSignupDraft() {
  const [draft, setDraft] = useAtom(signupDraftAtom);
  const [orgImageFile, setOrgImageFile] = useAtom(signupOrgImageFileAtom);

  const updateDraft = useCallback(
    (update: Partial<SignupDraft>) => {
      setDraft((prev) => {
        const next = { ...prev, ...update };
        writeStoredSignupDraft(next);
        return next;
      });
    },
    [setDraft],
  );

  const replaceDraft = useCallback(
    (next: SignupDraft) => {
      setDraft(next);
      writeStoredSignupDraft(next);
    },
    [setDraft],
  );

  const resetSignupDraft = useCallback(() => {
    setDraft(emptySignupDraft());
    setOrgImageFile(null);
    clearStoredSignupDraft();
  }, [setDraft, setOrgImageFile]);

  return {
    draft,
    updateDraft,
    replaceDraft,
    resetSignupDraft,
    orgImageFile,
    setOrgImageFile,
  };
}

export function useResetSignupDraft() {
  const setDraft = useSetAtom(signupDraftAtom);
  const setOrgImageFile = useSetAtom(signupOrgImageFileAtom);
  return useCallback(() => {
    setDraft(emptySignupDraft());
    setOrgImageFile(null);
    clearStoredSignupDraft();
  }, [setDraft, setOrgImageFile]);
}
