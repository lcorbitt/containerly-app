"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavShell } from "../TopNavShell";
import { CustomerTopNavAccountMenu } from "./CustomerTopNavAccountMenu";
import {
  CUSTOMER_TOP_NAV_LAYOUT_CLASS,
  CUSTOMER_TOP_NAV_LEFT_CLASS,
  CUSTOMER_TOP_NAV_LINK_CLASS,
  CUSTOMER_TOP_NAV_LOGIN_PATH,
  CUSTOMER_TOP_NAV_RIGHT_CLUSTER_CLASS,
  CUSTOMER_TOP_NAV_SECONDARY_LINK_CLASS,
  CUSTOMER_TOP_NAV_SHARED_SHIPMENTS_PATH,
  CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS,
} from "./constants";
import { useCustomerTopNav } from "./useCustomerTopNav";

export interface CustomerTopNavProps {
  /** Destination for the "Shared with me" link. Defaults to the operator shipments path. */
  sharedShipmentsHref?: string;
}

export function CustomerTopNav({
  sharedShipmentsHref = CUSTOMER_TOP_NAV_SHARED_SHIPMENTS_PATH,
}: CustomerTopNavProps = {}) {
  const { signedIn, sessionReady, brandHref } = useCustomerTopNav();

  return (
    <TopNavShell variant="marketing">
      <div className={CUSTOMER_TOP_NAV_LAYOUT_CLASS}>
        <div className={CUSTOMER_TOP_NAV_LEFT_CLASS}>
          <NavBrand href={brandHref} variant="marketing" />
        </div>

        <div className={CUSTOMER_TOP_NAV_RIGHT_CLUSTER_CLASS}>
          {sessionReady ? (
            signedIn ? (
              <>
                <Link href={sharedShipmentsHref} className={CUSTOMER_TOP_NAV_LINK_CLASS}>
                  Shared with me
                </Link>
                <ThemeToggle className={CUSTOMER_TOP_NAV_THEME_TOGGLE_CLASS} />
                <CustomerTopNavAccountMenu />
              </>
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
