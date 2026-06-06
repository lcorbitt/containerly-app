"use client";

import { useState } from "react";
import {
  SHIPMENT_SHARE_LAST_INVITE_BANNER_CLASS,
  SHIPMENT_SHARE_LAST_INVITE_COPY_BUTTON_CLASS,
  SHIPMENT_SHARE_LAST_INVITE_DISMISS_CLASS,
} from "./constants";

export interface ShipmentShareLastInviteBannerProps {
  url: string;
  origin: string;
  onDismiss: () => void;
  onToast: (message: string, variant: "success" | "error" | "info") => void;
}

export function ShipmentShareLastInviteBanner({
  url,
  origin,
  onDismiss,
  onToast,
}: ShipmentShareLastInviteBannerProps) {
  const [copyBusy, setCopyBusy] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `${origin}${url}`;

  async function copyUrl() {
    setCopyBusy(true);
    try {
      await navigator.clipboard.writeText(fullUrl);
      onToast("Link copied", "success");
    } catch {
      onToast("Could not copy", "error");
    } finally {
      setCopyBusy(false);
    }
  }

  return (
    <div className={SHIPMENT_SHARE_LAST_INVITE_BANNER_CLASS}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
        Copy this link once
      </p>
      <p className="mt-1 break-all font-mono text-xs text-emerald-950 dark:text-emerald-100">{fullUrl}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={copyBusy}
          onClick={() => void copyUrl()}
          className={SHIPMENT_SHARE_LAST_INVITE_COPY_BUTTON_CLASS}
        >
          Copy link
        </button>
        <button type="button" onClick={onDismiss} className={SHIPMENT_SHARE_LAST_INVITE_DISMISS_CLASS}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
