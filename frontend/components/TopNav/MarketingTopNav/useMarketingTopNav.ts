"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MARKETING_TOP_NAV_LOGIN_PATH } from "./constants";

export function useMarketingTopNav() {
  const pathname = usePathname();
  const hideMarketingLinks = pathname === MARKETING_TOP_NAV_LOGIN_PATH;
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
