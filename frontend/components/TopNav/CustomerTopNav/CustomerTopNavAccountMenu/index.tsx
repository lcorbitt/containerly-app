"use client";

import { Reveal } from "@/components/Reveal";
import {
  CUSTOMER_TOP_NAV_ACCOUNT_AVATAR_CLASS,
  CUSTOMER_TOP_NAV_ACCOUNT_HEADER_CLASS,
  CUSTOMER_TOP_NAV_ACCOUNT_ITEM_CLASS,
  CUSTOMER_TOP_NAV_ACCOUNT_PANEL_CLASS,
  CUSTOMER_TOP_NAV_ACCOUNT_SIGN_OUT_LABEL,
  CUSTOMER_TOP_NAV_ACCOUNT_SIGNING_OUT_LABEL,
  CUSTOMER_TOP_NAV_ACCOUNT_TRIGGER_CLASS,
} from "./constants";
import { useCustomerTopNavAccountMenu } from "./useCustomerTopNavAccountMenu";

export function CustomerTopNavAccountMenu() {
  const {
    open,
    toggle,
    containerRef,
    avatarUrl,
    initials,
    primaryLabel,
    secondaryLabel,
    logout,
    signingOut,
  } = useCustomerTopNavAccountMenu();

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={toggle}
        className={CUSTOMER_TOP_NAV_ACCOUNT_TRIGGER_CLASS}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <span className={CUSTOMER_TOP_NAV_ACCOUNT_AVATAR_CLASS}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
      </button>

      <Reveal show={open} className={CUSTOMER_TOP_NAV_ACCOUNT_PANEL_CLASS}>
        <div role="menu">
          <div className={CUSTOMER_TOP_NAV_ACCOUNT_HEADER_CLASS}>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {primaryLabel}
            </p>
            {secondaryLabel ? (
              <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                {secondaryLabel}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void logout()}
            disabled={signingOut}
            aria-busy={signingOut}
            className={CUSTOMER_TOP_NAV_ACCOUNT_ITEM_CLASS}
          >
            {signingOut
              ? CUSTOMER_TOP_NAV_ACCOUNT_SIGNING_OUT_LABEL
              : CUSTOMER_TOP_NAV_ACCOUNT_SIGN_OUT_LABEL}
          </button>
        </div>
      </Reveal>
    </div>
  );
}
