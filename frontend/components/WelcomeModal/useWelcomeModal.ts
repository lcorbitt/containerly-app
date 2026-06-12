"use client";

import { useAtom, useAtomValue } from "jotai";
import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  welcomeModalDismissedUserIdsAtom,
  welcomeModalOpenAtom,
} from "@/atoms/welcome-modal";
import { useNewShipmentModal } from "@/components/NewShipmentModal";
import { welcomeDisplayName } from "./utils";

interface UseWelcomeModalInput {
  fullName: string | null;
  email: string;
  userId: string;
}

export function useWelcomeModal({ fullName, email, userId }: UseWelcomeModalInput) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useAtom(welcomeModalOpenAtom);
  const dismissedIds = useAtomValue(welcomeModalDismissedUserIdsAtom);
  const [, setDismissedIds] = useAtom(welcomeModalDismissedUserIdsAtom);
  const { openNewShipmentModal } = useNewShipmentModal();

  const displayName = welcomeDisplayName(fullName, email);
  const dismissed = dismissedIds.includes(userId);
  const welcomeParam = searchParams.get("welcome") === "1";

  useEffect(() => {
    if (pathname !== "/dashboard") return;
    if (!welcomeParam) return;
    if (dismissed) return;
    setOpen(true);
  }, [pathname, dismissed, welcomeParam, setOpen]);

  const markDismissed = useCallback(() => {
    setDismissedIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }, [setDismissedIds, userId]);

  const stripWelcomeParam = useCallback(() => {
    if (!welcomeParam) return;
    router.replace("/dashboard");
  }, [welcomeParam, router]);

  const close = useCallback(() => {
    markDismissed();
    setOpen(false);
    stripWelcomeParam();
  }, [markDismissed, setOpen, stripWelcomeParam]);

  const onAddShipment = useCallback(() => {
    close();
    openNewShipmentModal();
  }, [close, openNewShipmentModal]);

  const onInviteTeam = useCallback(() => {
    close();
    router.push("/settings?tab=organization");
  }, [close, router]);

  const onOrganizationSettings = useCallback(() => {
    close();
    router.push("/settings?tab=organization");
  }, [close, router]);

  return {
    open,
    displayName,
    close,
    onAddShipment,
    onInviteTeam,
    onOrganizationSettings,
  };
}
