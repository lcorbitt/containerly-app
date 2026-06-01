"use client";

import { FileDown, PackagePlus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavBrand } from "../NavBrand";
import { TopNavBreadcrumb } from "../TopNavBreadcrumb";
import { TopNavShell } from "../TopNavShell";
import {
  AUTHENTICATED_TOP_NAV_ACTION_CLASS,
  AUTHENTICATED_TOP_NAV_ACTIONS_ROW_CLASS,
  AUTHENTICATED_TOP_NAV_AMBER_ACTION_CLASS,
  AUTHENTICATED_TOP_NAV_AMBER_ICON_CLASS,
  AUTHENTICATED_TOP_NAV_AVATAR_BUTTON_CLASS,
  AUTHENTICATED_TOP_NAV_BRAND_ROW_CLASS,
  AUTHENTICATED_TOP_NAV_MENU_CLASS,
  AUTHENTICATED_TOP_NAV_MENU_ITEM_CLASS,
  AUTHENTICATED_TOP_NAV_MENU_REVEAL_CLASS,
} from "./constants";
import { useAuthenticatedTopNav } from "./useAuthenticatedTopNav";
import type { AuthenticatedTopNavProps } from "./types";

export function AuthenticatedTopNav({ email, fullName }: AuthenticatedTopNavProps) {
  const {
    open,
    menuRef,
    orgSegment,
    tabSegment,
    activeSubTabName,
    initials,
    avatarUrl,
    accountPrimaryLabel,
    openNewShipmentModal,
    openBulkImportModal,
    openMockJourneyModal,
    toggleMenu,
    logout,
  } = useAuthenticatedTopNav({ email, fullName });

  return (
    <TopNavShell variant="app">
      <div className={AUTHENTICATED_TOP_NAV_BRAND_ROW_CLASS}>
        <NavBrand href="/dashboard" variant="app" />
        <TopNavBreadcrumb org={orgSegment} tab={tabSegment} subTabLabel={activeSubTabName} />
      </div>

      <div className={AUTHENTICATED_TOP_NAV_ACTIONS_ROW_CLASS}>
        {/* {showMockJourney ? (
          <button
            type="button"
            onClick={() => openMockJourneyModal()}
            className={AUTHENTICATED_TOP_NAV_AMBER_ACTION_CLASS}
            title="Simulate container journey (development)"
            aria-haspopup="dialog"
          >
            <Route className={`h-4 w-4 shrink-0 ${AUTHENTICATED_TOP_NAV_AMBER_ICON_CLASS}`} strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Simulate</span>
          </button>
        ) : null} */}
        <button
          type="button"
          onClick={() => openNewShipmentModal()}
          className={AUTHENTICATED_TOP_NAV_ACTION_CLASS}
          title="Create a new shipment"
          aria-haspopup="dialog"
        >
          <PackagePlus className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">New Shipment</span>
        </button>
        <button
          type="button"
          onClick={() => openBulkImportModal()}
          className={AUTHENTICATED_TOP_NAV_AMBER_ACTION_CLASS}
          title="Bulk import shipments from Excel or CSV"
          aria-haspopup="dialog"
        >
          <FileDown className={`h-4 w-4 shrink-0 ${AUTHENTICATED_TOP_NAV_AMBER_ICON_CLASS}`} strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Bulk Import</span>
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={toggleMenu}
            className={AUTHENTICATED_TOP_NAV_AVATAR_BUTTON_CLASS}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>

          <Reveal show={open} className={AUTHENTICATED_TOP_NAV_MENU_REVEAL_CLASS}>
            <div role="menu" className={AUTHENTICATED_TOP_NAV_MENU_CLASS}>
              <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {accountPrimaryLabel}
                </p>
                {orgSegment ? (
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {orgSegment.label}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void logout()}
                className={AUTHENTICATED_TOP_NAV_MENU_ITEM_CLASS}
              >
                Log out
              </button>
            </div>
          </Reveal>
        </div>
        <ThemeToggle />
      </div>
    </TopNavShell>
  );
}
