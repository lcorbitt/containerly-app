"use client";

import { useState } from "react";
import { resetPasswordForEmail } from "@/services/auth.service";
import { FORGOT_PASSWORD_FORM_SUCCESS_MESSAGE } from "./constants";

export function useForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) throw error;
      setSubmitted(true);
      setMessage(FORGOT_PASSWORD_FORM_SUCCESS_MESSAGE);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    message,
    submitted,
    loading,
    submit,
  };
}
