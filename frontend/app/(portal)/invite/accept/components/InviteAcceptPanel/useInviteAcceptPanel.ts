"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  acceptImporterInvite,
  checkPortalAccessEmail,
  previewCustomerInvite,
} from "@/services/shipment.service";
import { getBrowserAuthSession } from "@/services/auth.service";

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
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const acceptAndRedirect = useCallback(async () => {
    const accept = await acceptImporterInvite(token);
    if (!accept.ok) {
      setErrorMessage(accept.error);
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
      setShipmentId(preview.shipment_id);
      setInvitedEmail(preview.invited_email);
      setInvitedEmailMasked(preview.invited_email_masked);
      setPreviewLoading(false);

      // Already signed in (e.g. existing user clicking the link): accept immediately.
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

  const sendSignInLink = useCallback(async () => {
    if (!invitedEmail || !shipmentId) return;
    setErrorMessage(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const r = await checkPortalAccessEmail({ shipmentId, email: invitedEmail });
      if (!r.ok) {
        setErrorMessage(r.error);
        return;
      }
      setMessage(r.message);
      setLinkSent(r.outcome === "magic_link_sent");
    } finally {
      setSubmitting(false);
    }
  }, [invitedEmail, shipmentId]);

  return {
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
  };
}
