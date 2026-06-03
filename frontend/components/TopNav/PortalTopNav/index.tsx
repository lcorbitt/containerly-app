"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavShell } from "../TopNavShell";
import {
  PORTAL_TOP_NAV_LAYOUT_CLASS,
  PORTAL_TOP_NAV_LEFT_CLASS,
  PORTAL_TOP_NAV_LINK_CLASS,
  PORTAL_TOP_NAV_LOGIN_PATH,
  PORTAL_TOP_NAV_RIGHT_CLUSTER_CLASS,
  PORTAL_TOP_NAV_SECONDARY_LINK_CLASS,
  PORTAL_TOP_NAV_SHARED_SHIPMENTS_PATH,
  PORTAL_TOP_NAV_THEME_TOGGLE_CLASS,
} from "./constants";
import { usePortalTopNav } from "./usePortalTopNav";

export function PortalTopNav() {
  const { signedIn, sessionReady, brandHref, signOut } = usePortalTopNav();

  return (
    <TopNavShell variant="marketing">
      <div className={PORTAL_TOP_NAV_LAYOUT_CLASS}>
        <div className={PORTAL_TOP_NAV_LEFT_CLASS}>
          <NavBrand href={brandHref} variant="marketing" />
        </div>

        <div className={PORTAL_TOP_NAV_RIGHT_CLUSTER_CLASS}>
          {sessionReady ? (
            signedIn ? (
              <>
                <Link href={PORTAL_TOP_NAV_SHARED_SHIPMENTS_PATH} className={PORTAL_TOP_NAV_LINK_CLASS}>
                  Shared with me
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={PORTAL_TOP_NAV_SECONDARY_LINK_CLASS}
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href={PORTAL_TOP_NAV_LOGIN_PATH} className={PORTAL_TOP_NAV_SECONDARY_LINK_CLASS}>
                Sign in
              </Link>
            )
          ) : null}
          <ThemeToggle className={PORTAL_TOP_NAV_THEME_TOGGLE_CLASS} />
        </div>
      </div>
    </TopNavShell>
  );
}
