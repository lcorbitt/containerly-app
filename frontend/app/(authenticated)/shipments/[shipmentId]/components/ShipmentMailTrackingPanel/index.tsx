"use client";

import {
  SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_CLASS,
  SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_POST_APPROVAL,
  SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_PRE_APPROVAL,
  SHIPMENT_MAIL_TRACKING_CUSTOMER_VALUE_CLASS,
  SHIPMENT_MAIL_TRACKING_DISPLAY_LABEL_CLASS,
  SHIPMENT_MAIL_TRACKING_INPUT_CLASS,
  SHIPMENT_MAIL_TRACKING_DISABLED_HINT_CLASS,
  SHIPMENT_MAIL_TRACKING_DISABLED_HINT_LABEL,
  SHIPMENT_MAIL_TRACKING_INLINE_CUSTOMER_CLASS,
  SHIPMENT_MAIL_TRACKING_INLINE_INPUT_CLASS,
  SHIPMENT_MAIL_TRACKING_INLINE_ROW_CLASS,
  SHIPMENT_MAIL_TRACKING_INLINE_SAVE_BUTTON_CLASS,
  SHIPMENT_MAIL_TRACKING_INLINE_STACK_CLASS,
  SHIPMENT_MAIL_TRACKING_LABEL_CLASS,
  SHIPMENT_MAIL_TRACKING_PANEL_CLASS,
  SHIPMENT_MAIL_TRACKING_SAVE_BUTTON_CLASS,
  SHIPMENT_MAIL_TRACKING_TITLE,
} from "./constants";
import { useShipmentMailTrackingPanel } from "./useShipmentMailTrackingPanel";

function ShipmentMailTrackingCustomerDisplay({
  trackingNumber,
  postApproval,
  variant = "panel",
}: {
  trackingNumber: string;
  postApproval: boolean;
  variant?: "panel" | "inline";
}) {
  const hasTrackingNumber = trackingNumber.length > 0;

  if (variant === "inline") {
    return (
      <div className={SHIPMENT_MAIL_TRACKING_INLINE_ROW_CLASS}>
        <span className="shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {SHIPMENT_MAIL_TRACKING_TITLE}
        </span>
        {hasTrackingNumber ? (
          <span className={`${SHIPMENT_MAIL_TRACKING_CUSTOMER_VALUE_CLASS} text-sm`}>{trackingNumber}</span>
        ) : (
          <span className={SHIPMENT_MAIL_TRACKING_INLINE_CUSTOMER_CLASS}>
            {postApproval
              ? SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_POST_APPROVAL
              : SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_PRE_APPROVAL}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={SHIPMENT_MAIL_TRACKING_PANEL_CLASS}>
      <div className="min-w-0">
        <p className={SHIPMENT_MAIL_TRACKING_DISPLAY_LABEL_CLASS}>{SHIPMENT_MAIL_TRACKING_TITLE}</p>
        {hasTrackingNumber ? (
          <p className={SHIPMENT_MAIL_TRACKING_CUSTOMER_VALUE_CLASS}>{trackingNumber}</p>
        ) : (
          <p className={SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_CLASS}>
            {postApproval
              ? SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_POST_APPROVAL
              : SHIPMENT_MAIL_TRACKING_CUSTOMER_STANDBY_PRE_APPROVAL}
          </p>
        )}
      </div>
    </div>
  );
}

export function ShipmentMailTrackingPanel({
  shipmentId,
  organizationId,
  initialTrackingNumber,
  enabled = false,
  readOnly = false,
  variant = "panel",
  onSaved,
}: {
  shipmentId: string;
  organizationId: string;
  initialTrackingNumber?: string | null;
  enabled?: boolean;
  readOnly?: boolean;
  variant?: "panel" | "inline";
  onSaved?: () => void;
}) {
  const {
    trackingNumber,
    setTrackingNumber,
    savedNumber,
    documentsApproved,
    canEdit,
    canSave,
    saving,
    save,
    readOnly: isReadOnly,
  } = useShipmentMailTrackingPanel({
    shipmentId,
    organizationId,
    initialTrackingNumber,
    enabled,
    readOnly,
    onSaved,
  });

  if (isReadOnly) {
    return (
      <ShipmentMailTrackingCustomerDisplay
        trackingNumber={savedNumber}
        postApproval={documentsApproved}
        variant={variant}
      />
    );
  }

  if (variant === "inline") {
    return (
      <div className={SHIPMENT_MAIL_TRACKING_INLINE_STACK_CLASS}>
        {!documentsApproved ? (
          <p className={`${SHIPMENT_MAIL_TRACKING_DISABLED_HINT_CLASS} mb-2`}>
            {SHIPMENT_MAIL_TRACKING_DISABLED_HINT_LABEL}
          </p>
        ) : null}
        <div className={SHIPMENT_MAIL_TRACKING_INLINE_ROW_CLASS}>
          <label className="sr-only" htmlFor={`mail-tracking-${shipmentId}`}>
            {SHIPMENT_MAIL_TRACKING_TITLE}
          </label>
          <input
            id={`mail-tracking-${shipmentId}`}
            type="text"
            value={canEdit ? trackingNumber : savedNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            disabled={!canEdit}
            placeholder={documentsApproved ? "USPS / FedEx / DHL number" : SHIPMENT_MAIL_TRACKING_TITLE}
            className={SHIPMENT_MAIL_TRACKING_INLINE_INPUT_CLASS}
            aria-describedby={!documentsApproved ? `mail-tracking-hint-${shipmentId}` : undefined}
          />
          <button
            type="button"
            disabled={!canEdit || saving || !canSave}
            onClick={() => void save()}
            className={SHIPMENT_MAIL_TRACKING_INLINE_SAVE_BUTTON_CLASS}
          >
            {saving ? "Saving…" : "Save & Notify Customer"}
          </button>
        </div>
        {!documentsApproved ? (
          <p id={`mail-tracking-hint-${shipmentId}`} className="sr-only">
            {SHIPMENT_MAIL_TRACKING_DISABLED_HINT_LABEL}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={SHIPMENT_MAIL_TRACKING_PANEL_CLASS}>
      {!documentsApproved ? (
        <p className={`${SHIPMENT_MAIL_TRACKING_DISABLED_HINT_CLASS} mb-4`}>
          {SHIPMENT_MAIL_TRACKING_DISABLED_HINT_LABEL}
        </p>
      ) : null}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <label className={SHIPMENT_MAIL_TRACKING_LABEL_CLASS}>
          {SHIPMENT_MAIL_TRACKING_TITLE}
          <input
            type="text"
            value={canEdit ? trackingNumber : savedNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            disabled={!canEdit}
            placeholder={documentsApproved ? "USPS / FedEx / DHL number" : SHIPMENT_MAIL_TRACKING_TITLE}
            className={SHIPMENT_MAIL_TRACKING_INPUT_CLASS}
          />
        </label>
        <button
          type="button"
          disabled={!canEdit || saving || !canSave}
          onClick={() => void save()}
          className={SHIPMENT_MAIL_TRACKING_SAVE_BUTTON_CLASS}
        >
          {saving ? "Saving…" : "Save & Notify Customer"}
        </button>
      </div>
    </div>
  );
}
