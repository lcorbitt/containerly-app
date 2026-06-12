"use client";

import { Modal } from "@/components/Modal";
import {
  WELCOME_MODAL_ADD_SHIPMENT_LABEL,
  WELCOME_MODAL_BODY_INTRO,
  WELCOME_MODAL_CAPABILITIES,
  WELCOME_MODAL_CAPABILITIES_HEADING,
  WELCOME_MODAL_DISMISS_LABEL,
  WELCOME_MODAL_GHOST_BUTTON_CLASS,
  WELCOME_MODAL_INVITE_TEAM_LABEL,
  WELCOME_MODAL_PRIMARY_BUTTON_CLASS,
  WELCOME_MODAL_SECONDARY_BUTTON_CLASS,
  WELCOME_MODAL_TITLE,
} from "./constants";
import type { WelcomeModalProps } from "./types";

export function WelcomeModal({
  open,
  displayName,
  onClose,
  onAddShipment,
  onInviteTeam,
}: WelcomeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={WELCOME_MODAL_TITLE}
      description={`Welcome, ${displayName}!`}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button type="button" onClick={onClose} className={WELCOME_MODAL_GHOST_BUTTON_CLASS}>
            {WELCOME_MODAL_DISMISS_LABEL}
          </button>
          <button type="button" onClick={onInviteTeam} className={WELCOME_MODAL_SECONDARY_BUTTON_CLASS}>
            {WELCOME_MODAL_INVITE_TEAM_LABEL}
          </button>
          <button type="button" onClick={onAddShipment} className={WELCOME_MODAL_PRIMARY_BUTTON_CLASS}>
            {WELCOME_MODAL_ADD_SHIPMENT_LABEL}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {WELCOME_MODAL_BODY_INTRO}
      </p>
      <p className="mt-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {WELCOME_MODAL_CAPABILITIES_HEADING}
      </p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
        {WELCOME_MODAL_CAPABILITIES.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Modal>
  );
}
