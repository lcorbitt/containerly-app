import type { BreadcrumbSegment } from "../TopNavBreadcrumb/types";
import {
  CUSTOMER_MY_SHIPMENTS_LABEL,
  CUSTOMER_SETTINGS_LABEL,
  CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH,
  CUSTOMER_TOP_NAV_SETTINGS_PATH,
} from "./constants";

/** Top-level breadcrumb segment for the customer surfaces (mirrors operator nav resolution). */
export function customerActiveNavSegment(pathname: string): BreadcrumbSegment | null {
  if (
    pathname === CUSTOMER_TOP_NAV_SETTINGS_PATH ||
    pathname.startsWith(`${CUSTOMER_TOP_NAV_SETTINGS_PATH}/`)
  ) {
    return { label: CUSTOMER_SETTINGS_LABEL, href: CUSTOMER_TOP_NAV_SETTINGS_PATH };
  }

  // "My Shipments" covers the list page and the shipment hub.
  if (
    pathname === CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH ||
    pathname.startsWith(`${CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH}/`) ||
    pathname.startsWith("/shipments/hub/")
  ) {
    return { label: CUSTOMER_MY_SHIPMENTS_LABEL, href: CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH };
  }

  return null;
}
