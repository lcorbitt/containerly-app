export const CUSTOMER_SIDE_NAV_SHARED_SHIPMENTS_HREF = "/my-shipments";
export const CUSTOMER_SIDE_NAV_SETTINGS_HREF = "/my-settings";

export const customerSharedWithMeNavItem = {
  href: CUSTOMER_SIDE_NAV_SHARED_SHIPMENTS_HREF,
  label: "Shared With Me",
} as const;

export const customerSettingsNavItem = {
  href: CUSTOMER_SIDE_NAV_SETTINGS_HREF,
  label: "Settings",
} as const;

export const customerNavItems = [customerSharedWithMeNavItem, customerSettingsNavItem] as const;
