"use client";

import {
  SHIPMENT_DETAILS_CARD_CREATED_BANNER_CLASS,
  SHIPMENT_DETAILS_CARD_CREATED_BANNER_TEXT_CLASS,
} from "./constants";
import { ShipmentDetailsCardActionsMenu } from "./ShipmentDetailsCardActionsMenu";
import { shipmentCreatedBannerText } from "./utils";

export function ShipmentDetailsCardCreatedBanner({
  createdAt,
  creatorName,
  onEdit,
  onDelete,
  deleting = false,
}: {
  createdAt: string;
  creatorName: string | null | undefined;
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const showMenu = Boolean(onEdit || onDelete);

  return (
    <div className={SHIPMENT_DETAILS_CARD_CREATED_BANNER_CLASS}>
      <p className={SHIPMENT_DETAILS_CARD_CREATED_BANNER_TEXT_CLASS}>
        {shipmentCreatedBannerText(createdAt, creatorName)}
      </p>
      {showMenu ? (
        <ShipmentDetailsCardActionsMenu onEdit={onEdit} onDelete={onDelete} deleting={deleting} />
      ) : null}
    </div>
  );
}
