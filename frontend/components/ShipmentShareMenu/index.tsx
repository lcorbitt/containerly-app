"use client";

import { createPortal } from "react-dom";
import { ChevronDown, Globe, Link2 } from "lucide-react";
import { Radio, RadioGroup } from "@/components/Radio";
import { TextInput } from "@/components/TextInput";
import { Reveal } from "@/components/Reveal";
import { WorkspacePostSpinner } from "@/components/WorkspacePostSpinner";
import {
  SHIPMENT_SHARE_MENU_ATTENTION_BADGE_CLASS,
  SHIPMENT_SHARE_MENU_PANEL_BODY_CLASS,
  SHIPMENT_SHARE_MENU_PANEL_CLASS,
  SHIPMENT_SHARE_MENU_PANEL_REVEAL_CLASS,
  SHIPMENT_SHARE_MENU_PRIMARY_ACTION_CLASS,
  SHIPMENT_SHARE_MENU_PRIMARY_ACTION_INNER_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_SIDEBAR_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_LABEL_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_SIDEBAR_CLASS,
} from "./constants";
import { ShipmentShareAccessRequests } from "./ShipmentShareAccessRequests";
import { ShipmentShareLastInviteBanner } from "./ShipmentShareLastInviteBanner";
import { ShipmentSharePeopleList } from "./ShipmentSharePeopleList";
import type { ShipmentShareMenuProps } from "./types";
import { useShipmentShareMenu } from "./useShipmentShareMenu";
import { buildShipmentShareAccessRows, shipmentHubUrl } from "./utils";

export function ShipmentShareMenu({ shipmentId, state, variant = "sidebar" }: ShipmentShareMenuProps) {
  const { menuId, triggerRef, panelRef, open, panelPos, toggle } = useShipmentShareMenu();
  const accessRows = buildShipmentShareAccessRows(state);
  const hubUrl = shipmentHubUrl(shipmentId, state.origin);
  const triggerClass =
    variant === "sidebar" ? SHIPMENT_SHARE_MENU_TRIGGER_SIDEBAR_CLASS : SHIPMENT_SHARE_MENU_TRIGGER_CLASS;
  const attentionCount = state.pendingAccessRequests.length + state.pendingInvites.length;

  async function copyHubLink() {
    try {
      await navigator.clipboard.writeText(hubUrl);
      state.toast("Link copied", "success");
    } catch {
      state.toast("Could not copy", "error");
    }
  }

  const panel =
    typeof document !== "undefined" && panelPos
      ? createPortal(
          <Reveal
            show={open}
            className={SHIPMENT_SHARE_MENU_PANEL_REVEAL_CLASS}
            style={{
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
            }}
          >
            <div
              ref={panelRef}
              id={menuId}
              role="dialog"
              aria-label="Share shipment"
              className={SHIPMENT_SHARE_MENU_PANEL_CLASS}
            >
              <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <p className="text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">Share</p>
              </div>

              <div className={SHIPMENT_SHARE_MENU_PANEL_BODY_CLASS}>
                <ShipmentShareAccessRequests state={state} />

                <div className="space-y-1.5">
                  <RadioGroup className="flex flex-wrap gap-3">
                    <Radio
                      name="shipment-share-invite-delivery-mode"
                      value="email_invite"
                      checked={state.inviteDeliveryMode === "email_invite"}
                      onChange={() => state.setInviteDeliveryMode("email_invite")}
                      label="Send invite email"
                    />
                    <Radio
                      name="shipment-share-invite-delivery-mode"
                      value="allowlist_only"
                      checked={state.inviteDeliveryMode === "allowlist_only"}
                      onChange={() => state.setInviteDeliveryMode("allowlist_only")}
                      label="Allowlist only"
                    />
                  </RadioGroup>
                  <div className="flex items-center gap-2">
                    <TextInput
                      type="text"
                      value={state.inviteEmail}
                      onChange={(e) => state.setInviteEmail(e.target.value)}
                      placeholder="Email or group, separated by commas"
                      autoComplete="off"
                      containerClassName="min-w-0 flex-1"
                      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#2383E2] focus:outline-none focus:ring-2 focus:ring-[#2383E2]/30 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
                        state.inviteFieldError
                          ? "border-red-400 dark:border-red-600"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                      aria-invalid={state.inviteFieldError ? true : undefined}
                      aria-describedby={state.inviteFieldError ? "shipment-share-invite-email-error" : undefined}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void state.createInvite();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={state.inviteCreating}
                      onClick={() => void state.createInvite()}
                      className={SHIPMENT_SHARE_MENU_PRIMARY_ACTION_CLASS}
                    >
                      <span className={SHIPMENT_SHARE_MENU_PRIMARY_ACTION_INNER_CLASS}>
                        {state.inviteCreating ? <WorkspacePostSpinner /> : "Share"}
                      </span>
                    </button>
                  </div>
                  {state.inviteFieldError ? (
                    <p
                      id="shipment-share-invite-email-error"
                      role="alert"
                      className="text-xs text-red-600 dark:text-red-400"
                    >
                      {state.inviteFieldError}
                    </p>
                  ) : null}
                </div>

                {state.lastInviteUrl ? (
                  <ShipmentShareLastInviteBanner
                    url={state.lastInviteUrl}
                    origin={state.origin}
                    onDismiss={() => state.setLastInviteUrl(null)}
                    onToast={state.toast}
                  />
                ) : null}

                {state.loading ? (
                  <p className="text-sm text-zinc-500">Loading access…</p>
                ) : accessRows.length > 0 ? (
                  <ShipmentSharePeopleList rows={accessRows} state={state} />
                ) : (
                  <p className="text-sm text-zinc-500">No customers invited yet.</p>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-end border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => void copyHubLink()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  <Link2 className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  Copy link
                </button>
              </div>
            </div>
          </Reveal>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
        className={triggerClass}
      >
        <span className={SHIPMENT_SHARE_MENU_TRIGGER_LABEL_CLASS}>
          <Globe className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          Share
          {attentionCount > 0 ? (
            <span className={SHIPMENT_SHARE_MENU_ATTENTION_BADGE_CLASS} aria-label={`${attentionCount} pending`}>
              {attentionCount}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={`${SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_CLASS}${open ? " rotate-180" : ""}${variant === "sidebar" ? ` ${SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_SIDEBAR_CLASS}` : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {panel}
    </>
  );
}
