"use client";

import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  SHIPMENT_DETAILS_CARD_ACTIONS_MENU_ITEM_CLASS,
  SHIPMENT_DETAILS_CARD_ACTIONS_MENU_ITEM_DANGER_CLASS,
  SHIPMENT_DETAILS_CARD_ACTIONS_MENU_PANEL_CLASS,
  SHIPMENT_DETAILS_CARD_ACTIONS_MENU_REVEAL_CLASS,
  SHIPMENT_DETAILS_CARD_ACTIONS_MENU_TRIGGER_CLASS,
} from "./constants";
import type { ShipmentDetailsCardActionsMenuProps } from "./types";
import { useShipmentDetailsCardActionsMenu } from "./useShipmentDetailsCardActionsMenu";

export function ShipmentDetailsCardActionsMenu({
  onEdit,
  onDelete,
  deleting = false,
}: ShipmentDetailsCardActionsMenuProps) {
  const { open, menuRef, toggleMenu, closeMenu } = useShipmentDetailsCardActionsMenu();
  const showEdit = Boolean(onEdit);
  const showDelete = Boolean(onDelete);

  if (!showEdit && !showDelete) return null;

  return (
    <div className="relative z-[120] shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        className={SHIPMENT_DETAILS_CARD_ACTIONS_MENU_TRIGGER_CLASS}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Shipment actions"
        disabled={deleting}
      >
        {deleting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        )}
      </button>

      <Reveal show={open} className={SHIPMENT_DETAILS_CARD_ACTIONS_MENU_REVEAL_CLASS}>
        <div role="menu" className={SHIPMENT_DETAILS_CARD_ACTIONS_MENU_PANEL_CLASS}>
          {showEdit ? (
            <button
              type="button"
              role="menuitem"
              className={SHIPMENT_DETAILS_CARD_ACTIONS_MENU_ITEM_CLASS}
              onClick={() => {
                closeMenu();
                onEdit?.();
              }}
            >
              <Pencil className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
              Edit
            </button>
          ) : null}
          {showDelete ? (
            <button
              type="button"
              role="menuitem"
              className={SHIPMENT_DETAILS_CARD_ACTIONS_MENU_ITEM_DANGER_CLASS}
              disabled={deleting}
              onClick={() => {
                closeMenu();
                void onDelete?.();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 opacity-90" strokeWidth={2} aria-hidden />
              Delete
            </button>
          ) : null}
        </div>
      </Reveal>
    </div>
  );
}
