"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TextInput } from "@/components/TextInput";
import {
  LOGIN_FORM_BLURRED_CONTENT_CLASS,
  LOGIN_FORM_LOADING_CARD_CLASS,
  LOGIN_FORM_LOADING_OVERLAY_CLASS,
} from "./constants";
import { useLoginForm } from "./hooks/useLoginForm";

export function LoginForm() {
  const {
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
  } = useLoginForm();

  return (
    <div className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className={loading ? LOGIN_FORM_BLURRED_CONTENT_CLASS : ""}>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sign in</h1>
        <form
          onSubmit={submit}
          className="mt-6 flex flex-col gap-3"
          aria-busy={loading}
        >
          {mode === "signup" ? (
            <TextInput
              type="text"
              autoComplete="name"
              clearable={false}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={loading}
            />
          ) : null}
          <TextInput
            type="email"
            autoComplete="email"
            clearable={false}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
            <span className="text-zinc-300 dark:text-zinc-600">|</span>
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
            <p className="text-sm text-zinc-600 dark:text-zinc-400" role="alert">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="inline-flex h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-zinc-900 text-sm font-medium text-white transition-[opacity,transform] active:scale-[0.99] disabled:cursor-wait disabled:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {mode === "signup" ? "Create Account" : "Continue"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="underline">
            Back home
          </Link>
        </p>
      </div>

      {loading ? (
        <div
          className={LOGIN_FORM_LOADING_OVERLAY_CLASS}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className={LOGIN_FORM_LOADING_CARD_CLASS}>
            <Loader2 className="h-6 w-6 animate-spin text-primary-orange" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{loadingTitle}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{loadingSubtitle}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
