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
import { accountRoleLabel } from "@/utils/account-role";
import type { SideNavAccountMenuPanelPosition, SideNavAccountMenuProps } from "./types";

const PANEL_GAP_PX = 8;
const PANEL_MIN_WIDTH_PX = 224;

function measurePanelPosition(trigger: HTMLElement): SideNavAccountMenuPanelPosition {
  const rect = trigger.getBoundingClientRect();
  return {
    bottom: window.innerHeight - rect.top + PANEL_GAP_PX,
    left: rect.left,
    width: Math.max(rect.width, PANEL_MIN_WIDTH_PX),
  };
}

export function useSideNavAccountMenu({ email, fullName, isCustomer }: SideNavAccountMenuProps) {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const { profileImagePath } = useSessionAvatar();
  const avatarUrl = getProfileImagePublicUrlBrowser(profileImagePath);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<SideNavAccountMenuPanelPosition | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const syncPanelPosition = useCallback(() => {
    const trigger = accountMenuRef.current;
    if (!trigger) return;
    setPanelPosition(measurePanelPosition(trigger));
  }, []);

  const selectedOrg = useMemo(
    () => orgs.find((r) => r.organizations?.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId],
  );

  const orgName = selectedOrg?.organizations?.name?.trim() ?? null;

  const roleLabel = useMemo(
    () =>
      accountRoleLabel({
        isSuperAdmin,
        membershipRole: selectedOrg?.role,
        isCustomer,
      }),
    [isSuperAdmin, selectedOrg, isCustomer],
  );

  const initials = profileInitials({ full_name: fullName, email });
  const { primary: accountPrimaryLabel } = useMemo(
    () => profileMenuLabels(fullName, email),
    [email, fullName],
  );

  useEffect(() => {
    if (!accountMenuOpen) {
      setPanelPosition(null);
      return;
    }

    syncPanelPosition();

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (accountMenuRef.current?.contains(target)) return;
      if (menuPanelRef.current?.contains(target)) return;
      setAccountMenuOpen(false);
    }

    function onLayoutChange() {
      syncPanelPosition();
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onLayoutChange);
    window.addEventListener("scroll", onLayoutChange, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onLayoutChange);
      window.removeEventListener("scroll", onLayoutChange, true);
    };
  }, [accountMenuOpen, syncPanelPosition]);

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
    setAccountMenuOpen((value) => {
      const next = !value;
      if (next) {
        queueMicrotask(() => syncPanelPosition());
      }
      return next;
    });
  }, [syncPanelPosition]);

  return {
    accountMenuOpen,
    panelPosition,
    accountMenuRef,
    menuPanelRef,
    avatarUrl,
    initials,
    accountPrimaryLabel,
    orgName,
    roleLabel,
    toggleAccountMenu,
    logout,
    signingOut,
  };
}
