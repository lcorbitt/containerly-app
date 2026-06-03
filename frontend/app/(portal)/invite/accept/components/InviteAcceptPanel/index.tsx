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
    message,
    errorMessage,
    submitting,
    linkSent,
    sendSignInLink,
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

        {linkSent ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Check your inbox
            </p>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              {message ??
                "We sent a secure sign-in link to your email. Open it to view this shipment — no password required."}
            </p>
            <button
              type="button"
              onClick={() => void sendSignInLink()}
              disabled={submitting}
              className="mt-3 text-xs font-medium text-emerald-800 underline disabled:opacity-50 dark:text-emerald-200"
            >
              {submitting ? "Sending…" : "Resend link"}
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              We&apos;ll email a secure sign-in link to your invited address. No password needed.
            </p>

            <form
              className="mt-6 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void sendSignInLink();
              }}
            >
              <TextInput
                type="email"
                value={invitedEmailMasked ?? ""}
                readOnly
                disabled
                containerClassName="opacity-90"
                className="cursor-not-allowed bg-zinc-50 dark:bg-zinc-900"
              />
              {errorMessage ? (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errorMessage}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {submitting ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Already have a password?{" "}
              <Link href="/login" className="font-medium text-zinc-800 underline dark:text-zinc-200">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
