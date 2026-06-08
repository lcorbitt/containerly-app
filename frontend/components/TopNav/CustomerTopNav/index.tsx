"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavBreadcrumb } from "../TopNavBreadcrumb";
import { TopNavShell } from "../TopNavShell";
import { CustomerTopNavAccountMenu } from "./CustomerTopNavAccountMenu";
import { CustomerNotificationsMenu } from "./CustomerNotificationsMenu";
import { useCustomerNotifications } from "./useCustomerNotifications";
import {
  CUSTOMER_TOP_NAV_BRAND_ROW_CLASS,
  CUSTOMER_TOP_NAV_BREADCRUMB_BANNER_CLASS,
  CUSTOMER_TOP_NAV_BREADCRUMB_INLINE_CLASS,
  CUSTOMER_TOP_NAV_LAYOUT_CLASS,
  CUSTOMER_TOP_NAV_LEFT_CLASS,
  CUSTOMER_TOP_NAV_LINK_CLASS,
  CUSTOMER_TOP_NAV_LOGIN_PATH,
  CUSTOMER_TOP_NAV_RIGHT_CLUSTER_CLASS,
  CUSTOMER_TOP_NAV_SECONDARY_LINK_CLASS,
  CUSTOMER_MY_SHIPMENTS_LABEL,
  CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH,
  CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS,
} from "./constants";
import { useCustomerTopNav } from "./useCustomerTopNav";

export interface CustomerTopNavProps {
  /** Destination for the My Shipments link. */
  sharedShipmentsHref?: string;
  /** When true, account menu and nav links live in the sidenav; top nav shows brand + theme only. */
  shellMode?: boolean;
}

export function CustomerTopNav({
  sharedShipmentsHref = CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH,
  shellMode = false,
}: CustomerTopNavProps = {}) {
  const { signedIn, sessionReady, userId, brandHref, breadcrumb, hasBreadcrumbs } =
    useCustomerTopNav();
  const notifications = useCustomerNotifications(userId);

  const notificationsBell = (
    <CustomerNotificationsMenu
      open={notifications.open}
      alerts={notifications.alerts}
      unackedCount={notifications.unackedCount}
      menuRef={notifications.menuRef}
      onToggle={notifications.toggle}
      onClose={notifications.close}
    />
  );

  return (
    <TopNavShell
      variant="marketing"
      footer={
        hasBreadcrumbs ? (
          <div className={CUSTOMER_TOP_NAV_BREADCRUMB_BANNER_CLASS}>
            <TopNavBreadcrumb {...breadcrumb} />
          </div>
        ) : undefined
      }
    >
      <div className={CUSTOMER_TOP_NAV_LAYOUT_CLASS}>
        <div className={CUSTOMER_TOP_NAV_LEFT_CLASS}>
          <div className={CUSTOMER_TOP_NAV_BRAND_ROW_CLASS}>
            <NavBrand href={brandHref} variant="marketing" />
            {hasBreadcrumbs ? (
              <div className={CUSTOMER_TOP_NAV_BREADCRUMB_INLINE_CLASS}>
                <TopNavBreadcrumb {...breadcrumb} />
              </div>
            ) : null}
          </div>
        </div>

        <div className={CUSTOMER_TOP_NAV_RIGHT_CLUSTER_CLASS}>
          {sessionReady ? (
            signedIn ? (
              shellMode ? (
                <>
                  {notificationsBell}
                  <ThemeToggle className={CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS} />
                </>
              ) : (
                <>
                  <Link href={sharedShipmentsHref} className={CUSTOMER_TOP_NAV_LINK_CLASS}>
                    {CUSTOMER_MY_SHIPMENTS_LABEL}
                  </Link>
                  {notificationsBell}
                  <ThemeToggle className={CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS} />
                  <CustomerTopNavAccountMenu />
                </>
              )
            ) : (
              <>
                <Link
                  href={CUSTOMER_TOP_NAV_LOGIN_PATH}
                  className={CUSTOMER_TOP_NAV_SECONDARY_LINK_CLASS}
                >
                  Sign in
                </Link>
                <ThemeToggle className={CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS} />
              </>
            )
          ) : (
            <ThemeToggle className={CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS} />
          )}
        </div>
      </div>
    </TopNavShell>
  );
}
