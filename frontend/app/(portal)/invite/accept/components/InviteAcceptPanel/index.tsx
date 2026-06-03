"use client";

import Link from "next/link";
import { PageLoading } from "@/components/PageLoading";
import { TextInput } from "@/components/TextInput";
import { INVITE_ACCEPT_CARD_CLASS } from "./constants";
import type { InviteAcceptPanelProps } from "./types";
import { useInviteAcceptPanel } from "./useInviteAcceptPanel";

export function InviteAcceptPanel({ token }: InviteAcceptPanelProps) {
  const {
    previewLoading,
    previewError,
    checkingSession,
    orgName,
    shipmentLabel,
    invitedEmailMasked,
    mode,
    setMode,
    password,
    setPassword,
    fullName,
    setFullName,
    message,
    submitting,
    submitAuth,
  } = useInviteAcceptPanel(token);

  if (previewLoading || checkingSession) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
        <PageLoading loadingText={checkingSession ? "Confirming your access…" : "Loading invitation…"} />
      </div>
    );
  }

  if (previewError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Could not accept invite</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{previewError}</p>
        <Link href="/login" className="mt-6 inline-block text-sm font-medium underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className={INVITE_ACCEPT_CARD_CLASS}>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {orgName ?? "Containerly"}
        </p>
        <h1 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Join {shipmentLabel ?? "this shipment"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in or create an account with your invited email to open the customer portal.
        </p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={submitAuth}>
          <TextInput
            type="email"
            value={invitedEmailMasked ?? ""}
            readOnly
            disabled
            containerClassName="opacity-90"
            className="cursor-not-allowed bg-zinc-50 dark:bg-zinc-900"
          />
          {mode === "signup" ? (
            <TextInput
              type="text"
              autoComplete="name"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={submitting}
            />
          ) : null}
          <TextInput
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
          />
          {message ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {submitting ? "Working…" : mode === "signup" ? "Create account & accept" : "Sign in & accept"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {mode === "signin" ? (
            <>
              New to Containerly?{" "}
              <button
                type="button"
                className="font-medium text-zinc-800 underline dark:text-zinc-200"
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-zinc-800 underline dark:text-zinc-200"
                onClick={() => setMode("signin")}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
