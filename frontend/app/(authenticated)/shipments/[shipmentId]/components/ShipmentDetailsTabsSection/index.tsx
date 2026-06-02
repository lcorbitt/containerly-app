import type { ReactNode } from "react";
import {
  SHIPMENT_DETAILS_TABS_SECTION_CLASS,
  SHIPMENT_DETAILS_TABS_SECTION_ID,
} from "./constants";

export function ShipmentDetailsTabsSection({ children }: { children: ReactNode }) {
  return (
    <section id={SHIPMENT_DETAILS_TABS_SECTION_ID} className={SHIPMENT_DETAILS_TABS_SECTION_CLASS}>
      {children}
    </section>
  );
}
