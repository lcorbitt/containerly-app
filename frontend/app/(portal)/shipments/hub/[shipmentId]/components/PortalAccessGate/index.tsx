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

  const requested = outcome === "request_sent" || outcome === "already_requested";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className={PORTAL_ACCESS_GATE_CARD_CLASS}>
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{PORTAL_ACCESS_GATE_TITLE}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {showSignedInHint
            ? "This account doesn't have access to this shipment yet. Enter your invited email to continue."
            : PORTAL_ACCESS_GATE_INTRO}
        </p>

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
            {submitting ? "Signing you in…" : "View shipment"}
          </button>
        </form>

        {message ? (
          <p
            className={`mt-4 text-sm ${
              requested
                ? "text-zinc-600 dark:text-zinc-400"
                : "text-emerald-700 dark:text-emerald-300"
            }`}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Have a Containerly password?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/shipments/hub/${shipmentId}`)}`}
            className="font-medium text-zinc-800 underline dark:text-zinc-200"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
