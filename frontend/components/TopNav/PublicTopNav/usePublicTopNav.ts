"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PUBLIC_TOP_NAV_LOGIN_PATH } from "./constants";

export function usePublicTopNav() {
  const pathname = usePathname();
  const hideMarketingLinks = pathname === PUBLIC_TOP_NAV_LOGIN_PATH;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const toggleMobile = () => setMobileOpen((open) => !open);
  const closeMobile = () => setMobileOpen(false);

  return {
    hideMarketingLinks,
    mobileOpen,
    toggleMobile,
    closeMobile,
  };
}
