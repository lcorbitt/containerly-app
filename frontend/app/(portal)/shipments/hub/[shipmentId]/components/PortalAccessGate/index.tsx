"use client";

import Link from "next/link";
import { TextInput } from "@/components/TextInput";
import {
  PORTAL_ACCESS_GATE_CARD_CLASS,
  PORTAL_ACCESS_GATE_INTRO,
  PORTAL_ACCESS_GATE_TITLE,
} from "./constants";
import type { PortalAccessGateProps } from "./types";
import { usePortalAccessGate } from "./usePortalAccessGate";

export function PortalAccessGate({ shipmentId, showSignedInHint }: PortalAccessGateProps) {
  const { email, setEmail, submitting, message, outcome, submit } =
    usePortalAccessGate(shipmentId);

  const linkSent = outcome === "magic_link_sent";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className={PORTAL_ACCESS_GATE_CARD_CLASS}>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{PORTAL_ACCESS_GATE_TITLE}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {showSignedInHint
            ? "Your account does not have access to this shipment. Enter your invited email or request access."
            : PORTAL_ACCESS_GATE_INTRO}
        </p>

        {linkSent ? (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
              Check your inbox
            </p>
            <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
              {message ??
                "We sent a secure sign-in link to your email. Open it to view this shipment — no password required."}
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="mt-3 text-xs font-medium text-emerald-800 underline disabled:opacity-50 dark:text-emerald-200"
            >
              {submitting ? "Sending…" : "Resend link"}
            </button>
          </div>
        ) : (
          <>
            <form
              className="mt-6 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <TextInput
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {submitting ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>

            {message ? (
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400" role="status">
                {message}
              </p>
            ) : null}

            <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Already have a password?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(`/shipments/hub/${shipmentId}`)}`}
                className="font-medium text-zinc-800 underline dark:text-zinc-200"
              >
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
