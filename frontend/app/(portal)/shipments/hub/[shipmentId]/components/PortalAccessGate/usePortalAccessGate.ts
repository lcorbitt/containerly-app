"use client";

import { useCallback, useState } from "react";
import { checkPortalAccessEmail } from "@/services/shipment.service";
import { verifyEmailOtp } from "@/services/auth.service";

export function usePortalAccessGate(shipmentId: string) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"request_sent" | "already_requested" | null>(null);

  const submit = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setMessage("Enter a valid email address.");
      setOutcome(null);
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setOutcome(null);
    try {
      const r = await checkPortalAccessEmail({ shipmentId, email: trimmed });
      if (!r.ok) {
        setMessage(r.error);
        return;
      }

      if (r.outcome === "signed_in" && r.token_hash) {
        setMessage(r.message);
        const { error } = await verifyEmailOtp(r.token_hash, r.token_type ?? "magiclink");
        if (error) {
          setMessage(error.message);
          return;
        }
        // Session established; reload so the hub picks it up and renders the portal.
        window.location.reload();
        return;
      }

      if (r.outcome === "request_sent" || r.outcome === "already_requested") {
        setMessage(r.message);
        setOutcome(r.outcome);
      }
    } finally {
      setSubmitting(false);
    }
  }, [email, shipmentId]);

  return {
    email,
    setEmail,
    submitting,
    message,
    outcome,
    submit,
  };
}
