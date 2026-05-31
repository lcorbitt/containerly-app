"use client";

import { useState, type ReactNode } from "react";
import { Reveal } from "@/components/Reveal";
import { ShipmentHeaderActions } from "../ShipmentHeaderActions";
import { ShipmentDetailsCardCreatedBanner } from "./ShipmentDetailsCardCreatedBanner";
import {
  SHIPMENT_DETAILS_CARD_BODY_CLASS,
  SHIPMENT_DETAILS_CARD_CLASS,
  SHIPMENT_DETAILS_CARD_EDIT_ANCHOR_CLASS,
  SHIPMENT_DETAILS_CARD_EDIT_INNER_CLASS,
} from "./constants";

export function ShipmentDetailsCard({
  createdAt,
  creatorName,
  onEdit,
  editModal,
  showEditActions = true,
  children,
}: {
  createdAt: string;
  creatorName?: string | null;
  onEdit: () => void;
  editModal: ReactNode;
  /** When false, the hover edit control is hidden (e.g. Documents tab). */
  showEditActions?: boolean;
  children: ReactNode;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <header
      className={SHIPMENT_DETAILS_CARD_CLASS}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setHovered(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setHovered(false);
        }
      }}
    >
      <ShipmentDetailsCardCreatedBanner createdAt={createdAt} creatorName={creatorName} />
      <div className={SHIPMENT_DETAILS_CARD_BODY_CLASS}>
        {children}
        {editModal}
      </div>
      <div className={SHIPMENT_DETAILS_CARD_EDIT_ANCHOR_CLASS}>
        <Reveal show={hovered && showEditActions}>
          <div className={SHIPMENT_DETAILS_CARD_EDIT_INNER_CLASS}>
            <ShipmentHeaderActions onEdit={onEdit} />
          </div>
        </Reveal>
      </div>
    </header>
  );
}
