"use client";

import { useQuery } from "@tanstack/react-query";
import { getContainerWorkspace } from "@/services/workspace.service";

export const containerWorkspaceQueryKeyRoot = ["container-workspace"] as const;

export function containerWorkspaceQueryKey(
  organizationId: string,
  containerId: string,
) {
  return [...containerWorkspaceQueryKeyRoot, organizationId, containerId] as const;
}

export function useContainerWorkspaceQuery(input: {
  organizationId: string | null;
  containerId: string;
}) {
  return useQuery({
    queryKey: input.organizationId
      ? containerWorkspaceQueryKey(input.organizationId, input.containerId)
      : [...containerWorkspaceQueryKeyRoot, "disabled", input.containerId],
    queryFn: () =>
      getContainerWorkspace({
        organizationId: input.organizationId!,
        containerId: input.containerId,
      }),
    enabled: Boolean(input.organizationId),
  });
}
