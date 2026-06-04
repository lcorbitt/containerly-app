"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { profileMenuLabels } from "@/components/TopNav/AuthenticatedTopNav/utils";
import { getBrowserAuthSession, signOutBrowser } from "@/services/auth.service";
import { fetchMyProfileFields, getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import { profileInitials } from "@/utils/display-initials";
import { CUSTOMER_TOP_NAV_LOGIN_PATH } from "../constants";

/** Self-contained account menu for the customer portal shell (no operator providers available). */
export function useCustomerTopNavAccountMenu() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState<string | null>(null);
  const [profileImagePath, setProfileImagePath] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getBrowserAuthSession();
      if (cancelled) return;
      setEmail(session?.user?.email ?? "");
      try {
        const fields = await fetchMyProfileFields();
        if (cancelled) return;
        setFullName(fields.fullName);
        setProfileImagePath(fields.profileImagePath);
      } catch {
        // Non-fatal: fall back to email-derived initials.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatarUrl = getProfileImagePublicUrlBrowser(profileImagePath);
  const initials = profileInitials({ full_name: fullName, email });
  const { primary: primaryLabel, secondary: secondaryLabel } = profileMenuLabels(fullName, email);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  const logout = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    setOpen(false);
    try {
      await signOutBrowser();
      window.location.href = CUSTOMER_TOP_NAV_LOGIN_PATH;
    } catch {
      setSigningOut(false);
    }
  }, [signingOut]);

  return {
    open,
    toggle,
    containerRef,
    avatarUrl,
    initials,
    primaryLabel,
    secondaryLabel,
    logout,
    signingOut,
  };
}
