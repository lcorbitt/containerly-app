"use client";

import { Building2, CircleCheck, Package, Plus, UserPlus } from "lucide-react";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { Modal } from "@/components/Modal";
import {
  WELCOME_MODAL_ACTION_CARD_CLASS,
  WELCOME_MODAL_ACTION_GRID_CLASS,
  WELCOME_MODAL_ACTION_ICON_INVITE_CLASS,
  WELCOME_MODAL_ACTION_ICON_SHIPMENT_CLASS,
  WELCOME_MODAL_ACTION_LABEL_CLASS,
  WELCOME_MODAL_ADD_SHIPMENT_LABEL,
  WELCOME_MODAL_BODY_INTRO,
  WELCOME_MODAL_CALLOUT_BODY,
  WELCOME_MODAL_CALLOUT_BODY_CLASS,
  WELCOME_MODAL_CALLOUT_CLASS,
  WELCOME_MODAL_CALLOUT_ICON_WRAP_CLASS,
  WELCOME_MODAL_CALLOUT_INNER_CLASS,
  WELCOME_MODAL_CALLOUT_LINK_CLASS,
  WELCOME_MODAL_CALLOUT_LINK_LABEL,
  WELCOME_MODAL_CALLOUT_TITLE,
  WELCOME_MODAL_CALLOUT_TITLE_CLASS,
  WELCOME_MODAL_CAPABILITY_CHECK_CLASS,
  WELCOME_MODAL_CAPABILITY_ITEM_CLASS,
  WELCOME_MODAL_CAPABILITY_LIST_CLASS,
  WELCOME_MODAL_CAPABILITIES,
  WELCOME_MODAL_CAPABILITIES_HEADING,
  WELCOME_MODAL_CAPABILITIES_HEADING_CLASS,
  WELCOME_MODAL_CAPABILITIES_PANEL_CLASS,
  WELCOME_MODAL_CLOSE_BUTTON_CLASS,
  WELCOME_MODAL_FIRST_STEP_HEADING,
  WELCOME_MODAL_FIRST_STEP_HEADING_CLASS,
  WELCOME_MODAL_HERO_ICON_WRAP_CLASS,
  WELCOME_MODAL_INVITE_TEAM_LABEL,
  WELCOME_MODAL_SHELL_CLASS,
  WELCOME_MODAL_SUBTITLE_CLASS,
  WELCOME_MODAL_TITLE_CLASS,
} from "./constants";
import type { WelcomeModalProps } from "./types";

export function WelcomeModal({
  open,
  displayName,
  onClose,
  onAddShipment,
  onInviteTeam,
  onOrganizationSettings,
}: WelcomeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      hideCloseButton
      ariaLabel="Welcome"
      bodyClassName="px-6 pb-6 pt-4"
    >
      <div className={WELCOME_MODAL_SHELL_CLASS}>
        <DialogCloseButton onClick={onClose} className={WELCOME_MODAL_CLOSE_BUTTON_CLASS} />

        <div className={WELCOME_MODAL_HERO_ICON_WRAP_CLASS} aria-hidden>
          <Package className="h-8 w-8" strokeWidth={1.75} />
        </div>

        <h2 className={WELCOME_MODAL_TITLE_CLASS}>Welcome, {displayName}!</h2>
        <p className={WELCOME_MODAL_SUBTITLE_CLASS}>{WELCOME_MODAL_BODY_INTRO}</p>

        <div className={WELCOME_MODAL_CAPABILITIES_PANEL_CLASS}>
          <p className={WELCOME_MODAL_CAPABILITIES_HEADING_CLASS}>{WELCOME_MODAL_CAPABILITIES_HEADING}</p>
          <ul className={WELCOME_MODAL_CAPABILITY_LIST_CLASS}>
            {WELCOME_MODAL_CAPABILITIES.map((item) => (
              <li key={item} className={WELCOME_MODAL_CAPABILITY_ITEM_CLASS}>
                <CircleCheck className={WELCOME_MODAL_CAPABILITY_CHECK_CLASS} strokeWidth={2.25} aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={WELCOME_MODAL_CALLOUT_CLASS}>
          <div className={WELCOME_MODAL_CALLOUT_INNER_CLASS}>
            <div className={WELCOME_MODAL_CALLOUT_ICON_WRAP_CLASS} aria-hidden>
              <Building2 className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={WELCOME_MODAL_CALLOUT_TITLE_CLASS}>{WELCOME_MODAL_CALLOUT_TITLE}</p>
              <p className={WELCOME_MODAL_CALLOUT_BODY_CLASS}>{WELCOME_MODAL_CALLOUT_BODY}</p>
              <button type="button" onClick={onOrganizationSettings} className={WELCOME_MODAL_CALLOUT_LINK_CLASS}>
                {WELCOME_MODAL_CALLOUT_LINK_LABEL} →
              </button>
            </div>
          </div>
        </div>

        <p className={WELCOME_MODAL_FIRST_STEP_HEADING_CLASS}>{WELCOME_MODAL_FIRST_STEP_HEADING}</p>
        <div className={WELCOME_MODAL_ACTION_GRID_CLASS}>
          <button type="button" onClick={onAddShipment} className={WELCOME_MODAL_ACTION_CARD_CLASS}>
            <span className={WELCOME_MODAL_ACTION_ICON_SHIPMENT_CLASS} aria-hidden>
              <Plus className="h-6 w-6" strokeWidth={2.25} />
            </span>
            <span className={WELCOME_MODAL_ACTION_LABEL_CLASS}>{WELCOME_MODAL_ADD_SHIPMENT_LABEL}</span>
          </button>
          <button type="button" onClick={onInviteTeam} className={WELCOME_MODAL_ACTION_CARD_CLASS}>
            <span className={WELCOME_MODAL_ACTION_ICON_INVITE_CLASS} aria-hidden>
              <UserPlus className="h-6 w-6" strokeWidth={2} />
            </span>
            <span className={WELCOME_MODAL_ACTION_LABEL_CLASS}>{WELCOME_MODAL_INVITE_TEAM_LABEL}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
