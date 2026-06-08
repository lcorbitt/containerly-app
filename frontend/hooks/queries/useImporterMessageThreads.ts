"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchImporterShipmentMessageThreads } from "@/services/workspace.service";
import type { ShipmentMessageThreadSummary } from "@/types/workspace-load";

export const importerMessageThreadsQueryKeyRoot = ["importer-message-threads"] as const;

export function useImporterMessageThreadsQuery() {
  return useQuery({
    queryKey: importerMessageThreadsQueryKeyRoot,
    queryFn: async () => {
      const result = await fetchImporterShipmentMessageThreads();
      if (!result.ok) throw new Error(result.error);
      return result.threads;
    },
  });
}

export function useImporterMessageThreads(): ShipmentMessageThreadSummary[] {
  const q = useImporterMessageThreadsQuery();
  return q.data ?? [];
}
