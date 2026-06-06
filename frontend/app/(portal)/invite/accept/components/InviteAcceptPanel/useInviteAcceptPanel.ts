"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  acceptImporterInvite,
  checkPortalAccessEmail,
  previewCustomerInvite,
} from "@/services/shipment.service";
import { getBrowserAuthSession, verifyEmailOtp } from "@/services/auth.service";

export function useInviteAcceptPanel(token: string) {
  const router = useRouter();
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [shipmentLabel, setShipmentLabel] = useState<string | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [invitedEmailMasked, setInvitedEmailMasked] = useState<string | null>(null);

  const [checkingSession, setCheckingSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const acceptAndRedirect = useCallback(async () => {
    const accept = await acceptImporterInvite(token);
    if (!accept.ok) {
      setErrorMessage(accept.error);
      return false;
    }
    router.replace(`/shipments/hub/${accept.shipment_id}`);
    return true;
  }, [token, router]);

  const signInWithInvitedEmail = useCallback(async (email: string, shipId: string): Promise<boolean> => {
    const r = await checkPortalAccessEmail({ shipmentId: shipId, email });
    if (!r.ok) {
      setErrorMessage(r.error);
      return false;
    }
    if (r.outcome === "signed_in" && r.token_hash) {
      const { error } = await verifyEmailOtp(r.token_hash, r.token_type ?? "magiclink");
      if (error) {
        setErrorMessage(error.message);
        return false;
      }
      const session = await getBrowserAuthSession();
      if (!session) {
        setErrorMessage(
          "You're signed in, but your browser didn't keep the session. Disable private/incognito browsing or tracking protection for this site, then try again.",
        );
        return false;
      }
      window.location.assign(`/shipments/hub/${shipId}`);
      return true;
    }
    setErrorMessage(r.message);
    return false;
  }, []);

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
      setShipmentId(preview.shipment_id);
      setInvitedEmail(preview.invited_email);
      setInvitedEmailMasked(preview.invited_email_masked);
      setPreviewLoading(false);

      setCheckingSession(true);
      try {
        const session = await getBrowserAuthSession();
        if (cancelled) return;
        if (session) {
          await acceptAndRedirect();
          return;
        }

        await signInWithInvitedEmail(preview.invited_email, preview.shipment_id);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, acceptAndRedirect, signInWithInvitedEmail]);

  const continueToPortal = useCallback(async () => {
    if (!invitedEmail || !shipmentId) return;
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await signInWithInvitedEmail(invitedEmail, shipmentId);
    } finally {
      setSubmitting(false);
    }
  }, [invitedEmail, shipmentId, signInWithInvitedEmail]);

  return {
    previewLoading,
    previewError,
    checkingSession,
    orgName,
    shipmentLabel,
    invitedEmailMasked,
    errorMessage,
    submitting,
    continueToPortal,
  };
}
