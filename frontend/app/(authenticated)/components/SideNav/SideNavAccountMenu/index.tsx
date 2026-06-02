"use client";

import { Reveal } from "@/components/Reveal";
import {
  SIDE_NAV_ACCOUNT_MENU_AVATAR_CLASS,
  SIDE_NAV_ACCOUNT_MENU_ITEM_CLASS,
  SIDE_NAV_ACCOUNT_MENU_LOGOUT_LABEL,
  SIDE_NAV_ACCOUNT_MENU_PANEL_CLASS,
  SIDE_NAV_ACCOUNT_MENU_PRIMARY_LABEL_CLASS,
  SIDE_NAV_ACCOUNT_MENU_REVEAL_CLASS,
  SIDE_NAV_ACCOUNT_MENU_SIGNING_OUT_LABEL,
  SIDE_NAV_ACCOUNT_MENU_TRIGGER_CLASS,
} from "./constants";
import { useSideNavAccountMenu } from "./useSideNavAccountMenu";
import type { SideNavAccountMenuProps } from "./types";

export function SideNavAccountMenu({ email, fullName }: SideNavAccountMenuProps) {
  const {
    accountMenuOpen,
    accountMenuRef,
    avatarUrl,
    initials,
    accountPrimaryLabel,
    orgName,
    toggleAccountMenu,
    logout,
    signingOut,
  } = useSideNavAccountMenu({ email, fullName });

  return (
    <div className="relative shrink-0" ref={accountMenuRef}>
      <button
        type="button"
        onClick={toggleAccountMenu}
        className={SIDE_NAV_ACCOUNT_MENU_TRIGGER_CLASS}
        aria-expanded={accountMenuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <span className={SIDE_NAV_ACCOUNT_MENU_AVATAR_CLASS}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className={SIDE_NAV_ACCOUNT_MENU_PRIMARY_LABEL_CLASS}>{accountPrimaryLabel}</span>
      </button>

      <Reveal show={accountMenuOpen} className={SIDE_NAV_ACCOUNT_MENU_REVEAL_CLASS}>
        <div role="menu" className={SIDE_NAV_ACCOUNT_MENU_PANEL_CLASS}>
          <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
            <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {accountPrimaryLabel}
            </p>
            {orgName ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{orgName}</p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            disabled={signingOut}
            aria-busy={signingOut}
            className={`${SIDE_NAV_ACCOUNT_MENU_ITEM_CLASS} disabled:opacity-70`}
          >
            {signingOut ? SIDE_NAV_ACCOUNT_MENU_SIGNING_OUT_LABEL : SIDE_NAV_ACCOUNT_MENU_LOGOUT_LABEL}
          </button>
        </div>
      </Reveal>
    </div>
  );
}
