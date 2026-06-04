"use client";

import { useEffect, useState } from "react";
import { getBrowserAuthSession, subscribeToAuthState } from "@/services/auth.service";
import { CUSTOMER_TOP_NAV_SHARED_SHIPMENTS_PATH } from "./constants";

export function useCustomerTopNav() {
  const [signedIn, setSignedIn] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getBrowserAuthSession();
      if (cancelled) return;
      setSignedIn(Boolean(session));
      setSessionReady(true);
    })();
    // React to an in-page sign-in (portal access gate) without a full reload, so the nav
    // flips from "Sign in" to the account menu the moment the session lands.
    const unsubscribe = subscribeToAuthState((nextSignedIn) => {
      setSignedIn(nextSignedIn);
      setSessionReady(true);
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const brandHref = signedIn ? CUSTOMER_TOP_NAV_SHARED_SHIPMENTS_PATH : "/";

  return {
    signedIn,
    sessionReady,
    brandHref,
  };
}
