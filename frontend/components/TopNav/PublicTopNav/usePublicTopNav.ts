"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PUBLIC_TOP_NAV_LOGIN_PATH } from "./constants";

export function usePublicTopNav() {
  const pathname = usePathname();
  const hideMarketingLinks = pathname === PUBLIC_TOP_NAV_LOGIN_PATH;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(Boolean(data.user));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

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

  const showBrandTagline = isAuthenticated === false;

  return {
    hideMarketingLinks,
    mobileOpen,
    showBrandTagline,
    toggleMobile,
    closeMobile,
  };
}
