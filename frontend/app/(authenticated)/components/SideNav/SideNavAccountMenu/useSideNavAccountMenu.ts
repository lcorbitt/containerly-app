"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigationProgress } from "@/components/NavigationProgress";
import { profileMenuLabels } from "@/components/TopNav/AuthenticatedTopNav/utils";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useSessionAvatar } from "@/contexts/session-avatar";
import { signOutBrowser } from "@/services/auth.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import { profileInitials } from "@/utils/display-initials";
import type { SideNavAccountMenuProps } from "./types";

export function useSideNavAccountMenu({ email, fullName }: SideNavAccountMenuProps) {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const { profileImagePath } = useSessionAvatar();
  const avatarUrl = getProfileImagePublicUrlBrowser(profileImagePath);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const orgName = useMemo(() => {
    const selected = orgs.find((r) => r.organizations?.id === selectedOrgId);
    return selected?.organizations?.name?.trim() ?? null;
  }, [orgs, selectedOrgId]);

  const initials = profileInitials({ full_name: fullName, email });
  const { primary: accountPrimaryLabel } = useMemo(
    () => profileMenuLabels(fullName, email),
    [email, fullName],
  );

  useEffect(() => {
    if (!accountMenuOpen) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (accountMenuRef.current?.contains(target)) return;
      setAccountMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [accountMenuOpen]);

  const logout = useCallback(async () => {
    if (signingOut) return;

    setSigningOut(true);
    setAccountMenuOpen(false);
    startNavigation({ message: "Signing out..." });

    try {
      await signOutBrowser();
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }, [router, signingOut, startNavigation]);

  const toggleAccountMenu = useCallback(() => {
    setAccountMenuOpen((value) => !value);
  }, []);

  return {
    accountMenuOpen,
    accountMenuRef,
    avatarUrl,
    initials,
    accountPrimaryLabel,
    orgName,
    toggleAccountMenu,
    logout,
    signingOut,
  };
}
