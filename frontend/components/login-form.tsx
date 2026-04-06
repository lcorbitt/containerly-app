"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPassword, signUpWithEmail } from "@/services/auth-browser.service";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    // Yield so React can paint loading state before the auth round-trip (helps fast/local Supabase too).
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
      } else {
        const { error } = await signInWithPassword(email, password);
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
      <form
        onSubmit={submit}
        className="mt-6 flex flex-col gap-3"
        aria-busy={loading}
      >
        {mode === "signup" ? (
          <input
            type="text"
            autoComplete="name"
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={loading}
          />
        ) : null}
        <input
          type="email"
          autoComplete="email"
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            disabled={loading}
            className={`disabled:opacity-50 ${mode === "signin" ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <span className="text-zinc-300">|</span>
          <button
            type="button"
            disabled={loading}
            className={`disabled:opacity-50 ${mode === "signup" ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-500"}`}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </div>
        {message ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
            {message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 text-sm font-medium text-white transition-[opacity,transform] active:scale-[0.99] disabled:cursor-wait disabled:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? (
            <>
              <span
                className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              <span>{mode === "signup" ? "Creating account…" : "Signing in…"}</span>
            </>
          ) : mode === "signup" ? (
            "Create account"
          ) : (
            "Continue"
          )}
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
