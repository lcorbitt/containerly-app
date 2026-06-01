"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavShell } from "../TopNavShell";
import {
  PUBLIC_TOP_NAV_CTA_CLASS,
  PUBLIC_TOP_NAV_DESKTOP_ACTIONS_CLASS,
  PUBLIC_TOP_NAV_DESKTOP_NAV_CLASS,
  PUBLIC_TOP_NAV_LAYOUT_CLASS,
  PUBLIC_TOP_NAV_LEFT_CLASS,
  PUBLIC_TOP_NAV_LINKS,
  PUBLIC_TOP_NAV_LINK_CLASS,
  PUBLIC_TOP_NAV_LOGIN_PATH,
  PUBLIC_TOP_NAV_MOBILE_LINK_CLASS,
  PUBLIC_TOP_NAV_MOBILE_MENU_BUTTON_CLASS,
  PUBLIC_TOP_NAV_MOBILE_OVERLAY_CLASS,
  PUBLIC_TOP_NAV_RIGHT_CLUSTER_CLASS,
  PUBLIC_TOP_NAV_SECONDARY_LINK_CLASS,
} from "./constants";
import { usePublicTopNav } from "./usePublicTopNav";

export function PublicTopNav() {
  const { hideMarketingLinks, mobileOpen, toggleMobile, closeMobile } = usePublicTopNav();

  return (
    <>
      <TopNavShell variant="marketing">
        <div className={PUBLIC_TOP_NAV_LAYOUT_CLASS}>
          <div className={PUBLIC_TOP_NAV_LEFT_CLASS}>
            <NavBrand href="/" variant="marketing" />
          </div>

          {!hideMarketingLinks ? (
            <nav className={PUBLIC_TOP_NAV_DESKTOP_NAV_CLASS} aria-label="Marketing">
              {PUBLIC_TOP_NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={PUBLIC_TOP_NAV_LINK_CLASS}>
                  {label}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="hidden flex-1 md:block" aria-hidden />
          )}

          <div className={PUBLIC_TOP_NAV_RIGHT_CLUSTER_CLASS}>
            <div className={PUBLIC_TOP_NAV_DESKTOP_ACTIONS_CLASS}>
              <Link href={PUBLIC_TOP_NAV_LOGIN_PATH} className={PUBLIC_TOP_NAV_SECONDARY_LINK_CLASS}>
                Sign in
              </Link>
              <Link href={PUBLIC_TOP_NAV_LOGIN_PATH} className={PUBLIC_TOP_NAV_CTA_CLASS}>
                Get started
              </Link>
            </div>

            <button
              type="button"
              className={PUBLIC_TOP_NAV_MOBILE_MENU_BUTTON_CLASS}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={toggleMobile}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <ThemeToggle variant="marketing" />
          </div>
        </div>
      </TopNavShell>

      {mobileOpen ? (
        <div className={PUBLIC_TOP_NAV_MOBILE_OVERLAY_CLASS}>
          <div className="flex flex-1 flex-col gap-1 px-4 py-6">
            {!hideMarketingLinks
              ? PUBLIC_TOP_NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={PUBLIC_TOP_NAV_MOBILE_LINK_CLASS}
                    onClick={closeMobile}
                  >
                    {label}
                  </Link>
                ))
              : null}
            {!hideMarketingLinks ? <hr className="my-4 border-zinc-200 dark:border-white/10" /> : null}
            <Link
              href={PUBLIC_TOP_NAV_LOGIN_PATH}
              className={PUBLIC_TOP_NAV_MOBILE_LINK_CLASS}
              onClick={closeMobile}
            >
              Sign in
            </Link>
            <Link
              href={PUBLIC_TOP_NAV_LOGIN_PATH}
              className={`${PUBLIC_TOP_NAV_CTA_CLASS} mt-2 text-center`}
              onClick={closeMobile}
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
