import { SHIPMENT_DETAILS_CARD_CREATED_BANNER_CLASS } from "./constants";
import { shipmentCreatedBannerText } from "./utils";

export function ShipmentDetailsCardCreatedBanner({
  createdAt,
  creatorName,
}: {
  createdAt: string;
  creatorName: string | null | undefined;
}) {
  return (
    <p className={SHIPMENT_DETAILS_CARD_CREATED_BANNER_CLASS}>
      {shipmentCreatedBannerText(createdAt, creatorName)}
    </p>
  );
}
