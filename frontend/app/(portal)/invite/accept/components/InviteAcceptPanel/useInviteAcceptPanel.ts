"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { acceptImporterInvite, previewCustomerInvite } from "@/services/shipment.service";
import { getBrowserAuthSession, signInWithPassword, signUpWithEmail } from "@/services/auth.service";

export function useInviteAcceptPanel(token: string) {
  const router = useRouter();
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [shipmentLabel, setShipmentLabel] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedEmailMasked, setInvitedEmailMasked] = useState<string | null>(null);

  const [checkingSession, setCheckingSession] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const acceptAndRedirect = useCallback(async () => {
    const accept = await acceptImporterInvite(token);
    if (!accept.ok) {
      setMessage(accept.error);
      return false;
    }
    router.replace(`/shipments/hub/${accept.shipment_id}`);
    return true;
  }, [token, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      setPreviewError(null);

      const preview = await previewCustomerInvite(token);
      if (cancelled) return;
      if (!preview.ok) {
        setPreviewError(preview.error);
        setPreviewLoading(false);
        return;
      }
      setOrgName(preview.org_name);
      setShipmentLabel(preview.shipment_label);
      setInvitedEmail(preview.invited_email);
      setInvitedEmailMasked(preview.invited_email_masked);
      setPreviewLoading(false);

      const session = await getBrowserAuthSession();
      if (cancelled) return;
      if (session) {
        setCheckingSession(true);
        await acceptAndRedirect();
        setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, acceptAndRedirect]);

  const submitAuth = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!invitedEmail) return;
      setMessage(null);
      setSubmitting(true);
      try {
        if (mode === "signup") {
          const { error, session } = await signUpWithEmail({
            email: invitedEmail,
            password,
            fullName: fullName.trim() || undefined,
          });
          if (error) {
            setMessage(error.message);
            return;
          }
          if (!session) {
            setMessage("Check your email to confirm, then return to this invite link.");
            return;
          }
        } else {
          const { error } = await signInWithPassword(invitedEmail, password);
          if (error) {
            setMessage(error.message);
            return;
          }
        }
        await acceptAndRedirect();
      } finally {
        setSubmitting(false);
      }
    },
    [mode, password, fullName, invitedEmail, acceptAndRedirect],
  );

  return {
    previewLoading,
    previewError,
    checkingSession,
    orgName,
    shipmentLabel,
    invitedEmail,
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
  };
}
