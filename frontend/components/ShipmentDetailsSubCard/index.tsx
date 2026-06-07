import {
  SHIPMENT_DETAILS_SUB_CARD_BODY_CLASS,
  SHIPMENT_DETAILS_SUB_CARD_CLASS,
  SHIPMENT_DETAILS_SUB_CARD_HEADER_CLASS,
  SHIPMENT_DETAILS_SUB_CARD_ICON_CLASS,
  SHIPMENT_DETAILS_SUB_CARD_TITLE_CLASS,
} from "./constants";
import type { ShipmentDetailsSubCardProps } from "./types";

export function ShipmentDetailsSubCard({
  title,
  icon: Icon,
  children,
  className,
}: ShipmentDetailsSubCardProps) {
  return (
    <section
      className={className ? `${SHIPMENT_DETAILS_SUB_CARD_CLASS} ${className}` : SHIPMENT_DETAILS_SUB_CARD_CLASS}
      aria-label={title}
    >
      <header className={SHIPMENT_DETAILS_SUB_CARD_HEADER_CLASS}>
        <Icon className={SHIPMENT_DETAILS_SUB_CARD_ICON_CLASS} aria-hidden />
        <h3 className={SHIPMENT_DETAILS_SUB_CARD_TITLE_CLASS}>{title}</h3>
      </header>
      <div className={SHIPMENT_DETAILS_SUB_CARD_BODY_CLASS}>{children}</div>
    </section>
  );
}

export {
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_CONTENT_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_ICON_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_LABEL_CLASS,
  SHIPMENT_DETAILS_ASSESSMENT_ROW_TRAILING_CLASS,
} from "./constants";
