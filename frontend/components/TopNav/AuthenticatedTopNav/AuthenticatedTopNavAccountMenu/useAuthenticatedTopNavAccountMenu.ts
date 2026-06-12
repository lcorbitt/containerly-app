"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigationProgress } from "@/components/NavigationProgress";
import { profileMenuLabels } from "@/components/TopNav/AuthenticatedTopNav/utils";
import { useOrganizationWorkspaceOptional } from "@/atoms/organization-workspace";
import { useSessionAvatar } from "@/atoms/session-avatar";
import { signOutBrowser } from "@/services/auth.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";
import { accountRoleLabel } from "@/utils/account-role";
import { profileInitials } from "@/utils/display-initials";
import type { AuthenticatedTopNavAccountMenuProps } from "./types";

export function useAuthenticatedTopNavAccountMenu({
  email,
  fullName,
  isCustomer,
}: AuthenticatedTopNavAccountMenuProps) {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();
  const workspace = useOrganizationWorkspaceOptional();
  const orgs = workspace?.orgs ?? [];
  const selectedOrgId = workspace?.selectedOrgId ?? null;
  const isSuperAdmin = workspace?.isSuperAdmin ?? false;
  const { profileImagePath } = useSessionAvatar();
  const avatarUrl = getProfileImagePublicUrlBrowser(profileImagePath);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOrg = useMemo(
    () => orgs.find((r) => r.organizations?.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId],
  );

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

  const logout = useCallback(async () => {
    if (signingOut) return;

    setSigningOut(true);
    setOpen(false);
    startNavigation({ message: "Signing out..." });

    try {
      await signOutBrowser();
      router.push("/login");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }, [router, signingOut, startNavigation]);

  const toggle = useCallback(() => setOpen((value) => !value), []);

  return {
    open,
    toggle,
    containerRef,
    avatarUrl,
    initials,
    accountPrimaryLabel,
    roleLabel,
    logout,
    signingOut,
  };
}
