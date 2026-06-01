"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useOrgMessageThreads } from "@/hooks/queries/useOrgMessageThreads";

export type SideNavSecondaryPanel = "messages";

export function useSideNav(isSuperAdmin: boolean) {
  const pathname = usePathname();
  const { orgs, selectedOrgId } = useOrganizationWorkspace();
  const [secondaryPanelPath, setSecondaryPanelPath] = useState<{
    pathname: string;
    panel: SideNavSecondaryPanel;
  } | null>(null);
  const messageThreads = useOrgMessageThreads(selectedOrgId);

  const needsReplyCount = useMemo(
    () => messageThreads.filter((thread) => thread.last_author_kind === "customer").length,
    [messageThreads],
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
