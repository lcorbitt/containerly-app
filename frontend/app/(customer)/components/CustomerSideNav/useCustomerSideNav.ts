"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useImporterMessageThreads } from "@/hooks/queries/useShipmentMessageThreads";

export type CustomerSideNavSecondaryPanel = "messages";

export function useCustomerSideNav() {
  const pathname = usePathname();
  const [secondaryPanelPath, setSecondaryPanelPath] = useState<{
    pathname: string;
    panel: CustomerSideNavSecondaryPanel;
  } | null>(null);
  const messageThreads = useImporterMessageThreads();

  const unreadCount = useMemo(
    () => messageThreads.filter((thread) => thread.is_unread).length,
    [messageThreads],
  );

  const messagesOpen =
    secondaryPanelPath?.pathname === pathname && secondaryPanelPath.panel === "messages";

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
    messagesOpen,
    messageThreads,
    unreadCount,
    toggleMessages,
    closeSecondaryPanel,
  };
}
