"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPassword, signUpWithEmail } from "@/services/auth.service";
import {
  LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_IN,
  LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_UP,
  LOGIN_FORM_LOADING_SUBTITLE_WORKSPACE,
  LOGIN_FORM_LOADING_TITLE_SIGN_IN,
  LOGIN_FORM_LOADING_TITLE_SIGN_UP,
  LOGIN_FORM_LOADING_WORKSPACE_MESSAGE_DELAY_MS,
} from "../constants";

export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSubtitle, setLoadingSubtitle] = useState(
    LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_IN,
  );

  const loadingTitle =
    mode === "signup" ? LOGIN_FORM_LOADING_TITLE_SIGN_UP : LOGIN_FORM_LOADING_TITLE_SIGN_IN;

  useEffect(() => {
    if (!loading) {
      setLoadingSubtitle(
        mode === "signup"
          ? LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_UP
          : LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_IN,
      );
      return;
    }

    setLoadingSubtitle(
      mode === "signup"
        ? LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_UP
        : LOGIN_FORM_LOADING_SUBTITLE_INITIAL_SIGN_IN,
    );

    const timer = window.setTimeout(() => {
      setLoadingSubtitle(LOGIN_FORM_LOADING_SUBTITLE_WORKSPACE);
    }, LOGIN_FORM_LOADING_WORKSPACE_MESSAGE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [loading, mode]);

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
