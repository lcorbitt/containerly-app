"use client";

import { useCallback, useState } from "react";
import { checkPortalAccessEmail } from "@/services/shipment.service";

export function usePortalAccessGate(shipmentId: string) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<
    "magic_link_sent" | "request_sent" | "already_requested" | null
  >(null);

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
      setMessage(r.message);
      setOutcome(r.outcome);
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
