import { CUSTOMER_MY_SHIPMENTS_LABEL, CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH } from "@/components/TopNav/CustomerTopNav/constants";

export const CUSTOMER_SIDE_NAV_MY_SHIPMENTS_HREF = CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH;
export const CUSTOMER_SIDE_NAV_SETTINGS_HREF = "/my-settings";

export const customerMyShipmentsNavItem = {
  href: CUSTOMER_SIDE_NAV_MY_SHIPMENTS_HREF,
  label: CUSTOMER_MY_SHIPMENTS_LABEL,
} as const;

export const customerSettingsNavItem = {
  href: CUSTOMER_SIDE_NAV_SETTINGS_HREF,
  label: "Settings",
} as const;
