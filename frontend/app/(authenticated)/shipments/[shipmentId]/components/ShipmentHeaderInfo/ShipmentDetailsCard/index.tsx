"use client";

import type { ReactNode } from "react";
import { ShipmentDetailsCardCreatedBanner } from "./ShipmentDetailsCardCreatedBanner";
import {
  SHIPMENT_DETAILS_CARD_BODY_CLASS,
  SHIPMENT_DETAILS_CARD_CLASS,
} from "./constants";

export function ShipmentDetailsCard({
  createdAt,
  creatorName,
  onEdit,
  onDelete,
  deleting = false,
  children,
}: {
  createdAt: string;
  creatorName?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
  children: ReactNode;
}) {
  return (
    <header className={SHIPMENT_DETAILS_CARD_CLASS}>
      <ShipmentDetailsCardCreatedBanner
        createdAt={createdAt}
        creatorName={creatorName}
        onEdit={onEdit}
        onDelete={onDelete}
        deleting={deleting}
      />
      <div className={SHIPMENT_DETAILS_CARD_BODY_CLASS}>{children}</div>
    </header>
  );
}
