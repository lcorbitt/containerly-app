"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useOrgMessageThreads } from "@/hooks/queries/useOrgMessageThreads";
import { createClient } from "@/lib/supabase/client";

export type SideNavSecondaryPanel = "messages";

export function useSideNav(isSuperAdmin: boolean) {
  const pathname = usePathname();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const [secondaryPanelPath, setSecondaryPanelPath] = useState<{
    pathname: string;
    panel: SideNavSecondaryPanel;
  } | null>(null);
  const messageThreads = useOrgMessageThreads(selectedOrgId);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!cancelled) setCurrentUserId(data.user?.id ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const needsReplyCount = useMemo(
    () =>
      messageThreads.filter((thread) => {
        if (thread.last_author_kind === "customer") return true;
        if (
          thread.last_author_kind === "member" &&
          thread.last_author_user_id &&
          currentUserId &&
          thread.last_author_user_id !== currentUserId
        ) {
          return true;
        }
        return false;
      }).length,
    [messageThreads, currentUserId],
  );

  const messagesOpen =
    secondaryPanelPath?.pathname === pathname && secondaryPanelPath.panel === "messages";

  const isFreight =
    isSuperAdmin || orgs.some((r) => r.organizations != null && r.organizations.id != null);

  const toggleMessages = () => {
    setSecondaryPanelPath((current) =>
      current?.pathname === pathname && current.panel === "messages"
        ? null
        : { pathname, panel: "messages" },
    );
  };

  const closeSecondaryPanel = () => setSecondaryPanelPath(null);

  return {
    pathname,
    selectedOrgId,
    messagesOpen,
    messageThreads,
    needsReplyCount,
    isFreight,
    toggleMessages,
    closeSecondaryPanel,
  };
}
