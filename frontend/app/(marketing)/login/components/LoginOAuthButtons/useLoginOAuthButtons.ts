"use client";

import { useState } from "react";
import { signInWithOAuth, type OAuthProvider } from "@/services/auth.service";
import type { LoginOAuthButtonsProps } from "./types";

export function useLoginOAuthButtons({ next, initialError = null }: LoginOAuthButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError);

  async function signIn(provider: OAuthProvider) {
    setMessage(null);
    setLoading(true);
    try {
      const { error } = await signInWithOAuth(provider, next);
      if (error) throw error;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  }

  return {
    loading,
    message,
    signInWithGoogle: () => signIn("google"),
    signInWithMicrosoft: () => signIn("azure"),
  };
}
