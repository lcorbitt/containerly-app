"use client";

import { useEffect, useState } from "react";
import { getBrowserAuthSession, signOutBrowser } from "@/services/auth.service";
import { PORTAL_TOP_NAV_LOGIN_PATH, PORTAL_TOP_NAV_SHARED_SHIPMENTS_PATH } from "./constants";

export function usePortalTopNav() {
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
    return () => {
      cancelled = true;
    };
  }, []);

  const brandHref = signedIn ? PORTAL_TOP_NAV_SHARED_SHIPMENTS_PATH : "/";

  async function signOut() {
    await signOutBrowser();
    window.location.href = PORTAL_TOP_NAV_LOGIN_PATH;
  }

  return {
    signedIn,
    sessionReady,
    brandHref,
    signOut,
  };
}
