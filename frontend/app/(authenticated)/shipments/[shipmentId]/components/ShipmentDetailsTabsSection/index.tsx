import type { ReactNode } from "react";
import { SHIPMENT_DETAILS_TABS_SECTION_CLASS } from "./constants";

export function ShipmentDetailsTabsSection({ children }: { children: ReactNode }) {
  return <section className={SHIPMENT_DETAILS_TABS_SECTION_CLASS}>{children}</section>;
}
