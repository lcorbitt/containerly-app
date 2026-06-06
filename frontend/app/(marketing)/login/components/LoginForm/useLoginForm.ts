"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, signUpWithEmail } from "@/services/auth.service";
import {
  LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_UP,
  LOGIN_FORM_LOADING_TITLE_SIGN_IN,
  LOGIN_FORM_LOADING_TITLE_SIGN_UP,
} from "./constants";
import type { LoginFormMode } from "./types";

interface UseLoginFormInput {
  initialMode: LoginFormMode;
  next: string;
}

export function useLoginForm({ initialMode, next }: UseLoginFormInput) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<LoginFormMode>(initialMode);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadingTitle =
    mode === "signup" ? LOGIN_FORM_LOADING_TITLE_SIGN_UP : LOGIN_FORM_LOADING_TITLE_SIGN_IN;
  const loadingSubtitle =
    mode === "signup" ? LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_UP : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    try {
      if (mode === "signup") {
        const { error, session } = await signUpWithEmail({
          email,
          password,
          fullName: fullName.trim() || undefined,
        });
        if (error) throw error;
        if (session) {
          router.push(next);
          router.refresh();
          return;
        }
        setMessage("Check your email to confirm, then sign in.");
        setLoading(false);
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    mode,
    setMode,
    message,
    loading,
    loadingTitle,
    loadingSubtitle,
    submit,
  };
}
