"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPassword, syncServerAuthSession } from "@/services/auth.service";
import { LOGIN_FORM_LOADING_TITLE_SIGN_IN } from "./constants";

interface UseLoginFormInput {
  next: string;
}

export function useLoginForm({ next }: UseLoginFormInput) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      const sync = await syncServerAuthSession();
      if (sync.error) throw sync.error;
      router.push(next);
      router.refresh();
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
    message,
    loading,
    loadingTitle: LOGIN_FORM_LOADING_TITLE_SIGN_IN,
    submit,
  };
}
