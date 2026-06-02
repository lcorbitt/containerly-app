"use client";

import { createPortal } from "react-dom";
import { ChevronDown, Globe, Link2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { TextInput } from "@/components/TextInput";
import { Reveal } from "@/components/Reveal";
import { WorkspacePostSpinner } from "@/components/WorkspacePostSpinner";
import {
  SHIPMENT_SHARE_MENU_PANEL_CLASS,
  SHIPMENT_SHARE_MENU_PANEL_REVEAL_CLASS,
  SHIPMENT_SHARE_MENU_PRIMARY_ACTION_CLASS,
  SHIPMENT_SHARE_MENU_PRIMARY_ACTION_PORTAL_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_CLASS,
  SHIPMENT_SHARE_MENU_TRIGGER_PORTAL_CLASS,
} from "./constants";
import type { ShipmentShareMenuProps } from "./types";
import { useShipmentShareMenu } from "./useShipmentShareMenu";
import { buildShipmentShareAccessRows, shipmentPortalUrl } from "./utils";

export function ShipmentShareMenu({ shipmentId, state, variant = "sidebar" }: ShipmentShareMenuProps) {
  const primaryActionClass =
    variant === "portal"
      ? SHIPMENT_SHARE_MENU_PRIMARY_ACTION_PORTAL_CLASS
      : SHIPMENT_SHARE_MENU_PRIMARY_ACTION_CLASS;
  const { menuId, triggerRef, panelRef, open, panelPos, toggle } = useShipmentShareMenu();
  const accessRows = buildShipmentShareAccessRows(state);
  const portalUrl = shipmentPortalUrl(shipmentId, state.origin);

  async function copyPortalLink() {
    try {
      await navigator.clipboard.writeText(portalUrl);
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
                <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <p className="text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">Share</p>
                </div>

                <div className="space-y-4 p-4">
                  <div className="flex items-center gap-2">
                    <TextInput
                      type="text"
                      value={state.inviteEmail}
                      onChange={(e) => state.setInviteEmail(e.target.value)}
                      placeholder="Email or group, separated by commas"
                      autoComplete="off"
                      containerClassName="min-w-0 flex-1"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#2383E2] focus:outline-none focus:ring-2 focus:ring-[#2383E2]/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
                      className={primaryActionClass}
                    >
                      {state.inviteCreating ? <WorkspacePostSpinner /> : "Share"}
                    </button>
                  </div>

                  {state.loading ? (
                    <p className="text-sm text-zinc-500">Loading access…</p>
                  ) : accessRows.length > 0 ? (
                    <ul className="max-h-52 space-y-1 overflow-y-auto overscroll-contain">
                      {accessRows.map((row) => (
                        <li key={row.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5">
                          <span className="flex min-w-0 items-center gap-2.5">
                            <UserAvatar imageUrl={row.avatarUrl} label={row.label} size="md" />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                {row.label}
                              </span>
                              {row.sublabel ? (
                                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                                  {row.sublabel}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{row.role}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-500">No one has access yet.</p>
                  )}

                </div>

                <div className="flex items-center justify-end border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => void copyPortalLink()}
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
        className={SHIPMENT_SHARE_MENU_TRIGGER_PORTAL_CLASS}
      >
        <Globe className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
        Share
        <ChevronDown
          className={`${SHIPMENT_SHARE_MENU_TRIGGER_CHEVRON_CLASS}${open ? " rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {panel}
    </>
  );
}
