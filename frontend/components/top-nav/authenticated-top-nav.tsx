"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PackagePlus, Route } from "lucide-react";
import { useMockJourneyModal } from "@/contexts/mock-journey-modal";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useTrackContainerModal } from "@/contexts/track-container-modal";
import { shouldShowMockJourneyPanel } from "@/components/mock-journey-simulator";
import { useSessionAvatar } from "@/contexts/session-avatar";
import { getProfileImagePublicUrlBrowser } from "@/services/profile-browser.service";
import { signOutBrowser } from "@/services/auth-browser.service";
import { NavBrand } from "./nav-brand";
import { TopNavShell } from "./top-nav-shell";

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim() ?? "";
  if (!local) return "?";
  const parts = local.split(/[.\-_]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function AuthenticatedTopNav({ email }: { email: string }) {
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

  return (
    <TopNavShell variant="app">
      <NavBrand href="/dashboard" variant="app" />

      <div className="flex items-center gap-2 sm:gap-6">
        {showMockJourney ? (
          <button
            type="button"
            onClick={() => openMockJourneyModal()}
            className="inline-flex px-4 py-2 shrink-0 items-center gap-4 rounded-lg border border-amber-200/90 bg-amber-50/90 text-sm font-medium text-amber-950 shadow-sm transition hover:border-amber-300 hover:bg-amber-100/90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-400/50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:border-amber-700 dark:hover:bg-amber-950/60 dark:focus-visible:ring-amber-500/40"
            title="Simulate container journey (development)"
            aria-haspopup="dialog"
          >
            <Route className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-200" strokeWidth={2} aria-hidden />
            <span className="hidden sm:inline">Simulate</span>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => openTrackContainerModal()}
          className="inline-flex px-4 py-2 shrink-0 items-center gap-4 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 dark:hover:bg-zinc-800 dark:focus-visible:ring-zinc-500/40"
          title="Track a container"
          aria-haspopup="dialog"
        >
          <PackagePlus className="h-4 w-4 shrink-0 text-zinc-600 dark:text-zinc-300" strokeWidth={2} aria-hidden />
          <span className="hidden sm:inline">Track Shipment</span>
        </button>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm font-medium text-zinc-800 ring-2 ring-transparent transition hover:bg-zinc-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-zinc-400 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600 dark:focus-visible:ring-zinc-500"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label="Account menu"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
            >
              <div className="border-b border-zinc-100 p-4 dark:border-zinc-800">
                <p className="truncate text-xs text-zinc-500">Signed in as</p>
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {email || "Account"}
                </p>
                {selectedOrgName ? (
                  <>
                    <p className="mt-3 truncate text-xs text-zinc-500">Organization</p>
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {selectedOrgName}
                    </p>
                  </>
                ) : null}
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void logout()}
                className="w-full cursor-pointer rounded-bl-xl rounded-br-xl p-4 text-left text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </TopNavShell>
  );
}
