"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavShell } from "../TopNavShell";
import {
  MARKETING_TOP_NAV_CTA_CLASS,
  MARKETING_TOP_NAV_DESKTOP_ACTIONS_CLASS,
  MARKETING_TOP_NAV_DESKTOP_NAV_CLASS,
  MARKETING_TOP_NAV_LAYOUT_CLASS,
  MARKETING_TOP_NAV_LEFT_CLASS,
  MARKETING_TOP_NAV_LINKS,
  MARKETING_TOP_NAV_LINK_CLASS,
  MARKETING_TOP_NAV_LOGIN_PATH,
  MARKETING_TOP_NAV_MOBILE_LINK_CLASS,
  MARKETING_TOP_NAV_MOBILE_MENU_BUTTON_CLASS,
  MARKETING_TOP_NAV_MOBILE_OVERLAY_CLASS,
  MARKETING_TOP_NAV_RIGHT_CLUSTER_CLASS,
  MARKETING_TOP_NAV_SECONDARY_LINK_CLASS,
  MARKETING_TOP_NAV_THEME_TOGGLE_CLASS,
} from "./constants";
import { useMarketingTopNav } from "./useMarketingTopNav";

export function MarketingTopNav() {
  const { hideMarketingLinks, mobileOpen, toggleMobile, closeMobile } = useMarketingTopNav();

  return (
    <>
      <TopNavShell variant="marketing">
        <div className={MARKETING_TOP_NAV_LAYOUT_CLASS}>
          <div className={`${MARKETING_TOP_NAV_LEFT_CLASS} gap-3 sm:gap-4`}>
            <NavBrand href="/" variant="marketing" />
          </div>

          {!hideMarketingLinks ? (
            <nav className={MARKETING_TOP_NAV_DESKTOP_NAV_CLASS} aria-label="Marketing">
              {MARKETING_TOP_NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={MARKETING_TOP_NAV_LINK_CLASS}>
                  {label}
                </Link>
              ))}
            </nav>
          ) : (
            <div className="hidden flex-1 md:block" aria-hidden />
          )}

          <div className={MARKETING_TOP_NAV_RIGHT_CLUSTER_CLASS}>
            <div className={MARKETING_TOP_NAV_DESKTOP_ACTIONS_CLASS}>
              <Link href={MARKETING_TOP_NAV_LOGIN_PATH} className={MARKETING_TOP_NAV_SECONDARY_LINK_CLASS}>
                Sign in
              </Link>
              <Link href={MARKETING_TOP_NAV_LOGIN_PATH} className={MARKETING_TOP_NAV_CTA_CLASS}>
                Get Started
              </Link>
            </div>

            <button
              type="button"
              className={MARKETING_TOP_NAV_MOBILE_MENU_BUTTON_CLASS}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              onClick={toggleMobile}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <ThemeToggle className={MARKETING_TOP_NAV_THEME_TOGGLE_CLASS} />
          </div>
        </div>
      </TopNavShell>

      {mobileOpen ? (
        <div className={MARKETING_TOP_NAV_MOBILE_OVERLAY_CLASS}>
          <div className="flex flex-1 flex-col gap-1 px-4 py-6">
            {!hideMarketingLinks
              ? MARKETING_TOP_NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={MARKETING_TOP_NAV_MOBILE_LINK_CLASS}
                    onClick={closeMobile}
                  >
                    {label}
                  </Link>
                ))
              : null}
            {!hideMarketingLinks ? <hr className="my-4 border-zinc-200 dark:border-white/10" /> : null}
            <Link
              href={MARKETING_TOP_NAV_LOGIN_PATH}
              className={MARKETING_TOP_NAV_MOBILE_LINK_CLASS}
              onClick={closeMobile}
            >
              Sign in
            </Link>
            <Link
              href={MARKETING_TOP_NAV_LOGIN_PATH}
              className={`${MARKETING_TOP_NAV_CTA_CLASS} mt-2 text-center`}
              onClick={closeMobile}
            >
              Get Started
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
