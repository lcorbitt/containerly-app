"use client";

import { Reveal } from "@/components/Reveal";
import {
  AUTHENTICATED_TOP_NAV_ACCOUNT_AVATAR_CLASS,
  AUTHENTICATED_TOP_NAV_ACCOUNT_HEADER_CLASS,
  AUTHENTICATED_TOP_NAV_ACCOUNT_ITEM_CLASS,
  AUTHENTICATED_TOP_NAV_ACCOUNT_LOGOUT_LABEL,
  AUTHENTICATED_TOP_NAV_ACCOUNT_PANEL_CLASS,
  AUTHENTICATED_TOP_NAV_ACCOUNT_ROLE_LABEL_CLASS,
  AUTHENTICATED_TOP_NAV_ACCOUNT_SIGNING_OUT_LABEL,
  AUTHENTICATED_TOP_NAV_ACCOUNT_TRIGGER_CLASS,
} from "./constants";
import { useAuthenticatedTopNavAccountMenu } from "./useAuthenticatedTopNavAccountMenu";
import type { AuthenticatedTopNavAccountMenuProps } from "./types";

export function AuthenticatedTopNavAccountMenu(props: AuthenticatedTopNavAccountMenuProps) {
  const {
    open,
    toggle,
    containerRef,
    avatarUrl,
    initials,
    accountPrimaryLabel,
    roleLabel,
    logout,
    signingOut,
  } = useAuthenticatedTopNavAccountMenu(props);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className={AUTHENTICATED_TOP_NAV_ACCOUNT_TRIGGER_CLASS}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className={AUTHENTICATED_TOP_NAV_ACCOUNT_AVATAR_CLASS}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
      </button>

      <Reveal show={open} className={AUTHENTICATED_TOP_NAV_ACCOUNT_PANEL_CLASS}>
        <div role="menu">
          <div className={AUTHENTICATED_TOP_NAV_ACCOUNT_HEADER_CLASS}>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {accountPrimaryLabel}
            </p>
            {roleLabel ? (
              <p className={AUTHENTICATED_TOP_NAV_ACCOUNT_ROLE_LABEL_CLASS}>{roleLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            disabled={signingOut}
            aria-busy={signingOut}
            className={AUTHENTICATED_TOP_NAV_ACCOUNT_ITEM_CLASS}
          >
            {signingOut
              ? AUTHENTICATED_TOP_NAV_ACCOUNT_SIGNING_OUT_LABEL
              : AUTHENTICATED_TOP_NAV_ACCOUNT_LOGOUT_LABEL}
          </button>
        </div>
      </Reveal>
    </div>
  );
}
