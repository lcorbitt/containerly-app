"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Local Supabase defaults to enable_confirmations = false: no email is sent, session is often returned immediately.
        if (data.session) {
          router.push(next);
          router.refresh();
          return;
        }
        setMessage("Check your email to confirm, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Use Supabase Auth (email / password). Create an organization on the dashboard.
      </p>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          autoComplete="email"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className={mode === "signin" ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <span className="text-zinc-300">|</span>
          <button
            type="button"
            className={mode === "signup" ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>
        {message ? <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Continue"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-zinc-400">
        <Link href="/" className="underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
