"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shouldShowMockJourneyPanel } from "@/components/MockJourneySimulator";
import { useMockJourneyModal } from "@/contexts/mock-journey-modal";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useSessionAvatar } from "@/contexts/session-avatar";
import { useTrackContainerModal } from "@/contexts/track-container-modal";
import { signOutBrowser } from "@/services/auth.service";
import { getProfileImagePublicUrlBrowser } from "@/services/profile.service";

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "?";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function useAuthenticatedTopNav(email: string) {
  const router = useRouter();
  const { openTrackContainerModal } = useTrackContainerModal();
  const { openMockJourneyModal } = useMockJourneyModal();
  const showMockJourney = shouldShowMockJourneyPanel();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const { profileImagePath } = useSessionAvatar();
  const avatarUrl = getProfileImagePublicUrlBrowser(profileImagePath);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedOrgName = useMemo(() => {
    const selected = orgs.find((r) => r.organizations?.id === selectedOrgId);
    return selected?.organizations?.name?.trim() || null;
  }, [orgs, selectedOrgId]);

  const initials = initialsFromEmail(email);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const logout = useCallback(async () => {
    setOpen(false);
    await signOutBrowser();
    router.push("/login");
    router.refresh();
  }, [router]);

  const toggleMenu = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  return {
    open,
    menuRef,
    selectedOrgName,
    initials,
    avatarUrl,
    showMockJourney,
    openTrackContainerModal,
    openMockJourneyModal,
    toggleMenu,
    logout,
  };
}
