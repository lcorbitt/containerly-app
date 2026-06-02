"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { checkPortalAccessEmail } from "@/services/shipment.service";

export function usePortalAccessGate(shipmentId: string) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"invited" | "request_sent" | "already_requested" | null>(
    null,
  );

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

  const goToSignIn = useCallback(() => {
    const next = `/shipments/hub/${shipmentId}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }, [router, shipmentId]);

  const goToSignUp = useCallback(() => {
    const next = `/shipments/hub/${shipmentId}`;
    router.push(`/login?next=${encodeURIComponent(next)}&mode=signup`);
  }, [router, shipmentId]);

  return {
    email,
    setEmail,
    submitting,
    message,
    outcome,
    submit,
    goToSignIn,
    goToSignUp,
  };
}
