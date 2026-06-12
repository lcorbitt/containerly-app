"use client";

import { useState } from "react";
import {
  signInWithPassword,
  signUpWithEmail,
  syncServerAuthSession,
} from "@/services/auth.service";
import { passwordsMatch, resolveReferralSource } from "./utils";

interface UseSignupAccountStepInput {
  onContinue: () => void | Promise<void>;
}

export function useSignupAccountStep({ onContinue }: UseSignupAccountStepInput) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralOption, setReferralOption] = useState("");
  const [referralOther, setReferralOther] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!passwordsMatch(password, confirmPassword)) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    try {
      const referralSource = resolveReferralSource(referralOption, referralOther);
      const { error, session } = await signUpWithEmail({
        email,
        password,
        fullName: fullName.trim(),
        referralSource,
      });
      if (error) throw error;

      if (!session) {
        const signIn = await signInWithPassword(email, password);
        if (signIn.error) {
          setMessage("Check your email to confirm, then return here to continue.");
          setLoading(false);
          return;
        }
      }

      const sync = await syncServerAuthSession();
      if (sync.error) {
        setMessage(sync.error.message);
        setLoading(false);
        return;
      }

      await onContinue();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not create account");
      setLoading(false);
    }
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
    loading,
    submit,
  };
}
