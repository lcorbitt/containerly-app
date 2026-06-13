"use client";

import { useState } from "react";
import { useSignupDraft } from "@/atoms/signup-draft";
import { initialReferralFields, passwordsMatch, resolveReferralSource } from "./utils";

interface UseSignupAccountStepInput {
  onContinue: () => void;
}

export function useSignupAccountStep({ onContinue }: UseSignupAccountStepInput) {
  const { draft, patchDraft } = useSignupDraft();
  const initialReferral = initialReferralFields(draft.account?.referralSource);

  const [fullName, setFullName] = useState(draft.account?.fullName ?? "");
  const [email, setEmail] = useState(draft.account?.email ?? "");
  const [password, setPassword] = useState(draft.account?.password ?? "");
  const [confirmPassword, setConfirmPassword] = useState(draft.account?.password ?? "");
  const [referralOption, setReferralOption] = useState(initialReferral.option);
  const [referralOther, setReferralOther] = useState(initialReferral.other);
  const [message, setMessage] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!passwordsMatch(password, confirmPassword)) {
      setMessage("Passwords do not match.");
      return;
    }

      const referralSource = resolveReferralSource(referralOption, referralOther);
    patchDraft({
      account: {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        referralSource: referralSource ?? "",
      },
    });
    onContinue();
  }

  return {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    referralOption,
    setReferralOption,
    referralOther,
    setReferralOther,
    message,
    submit,
  };
}
