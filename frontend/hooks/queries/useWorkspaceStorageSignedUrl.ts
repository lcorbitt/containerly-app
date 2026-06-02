import { useQuery } from "@tanstack/react-query";
import { fetchWorkspaceStorageSignedUrl } from "@/services/workspace.service";
import type { WorkspaceStoragePreviewVariant } from "@/utils/workspace-storage-preview";

const SIGNED_URL_STALE_MS = 50 * 60 * 1000;

export function workspaceStorageSignedUrlQueryKey(
  storagePath: string,
  previewVariant: WorkspaceStoragePreviewVariant,
) {
  return ["workspace-storage-signed-url", storagePath, previewVariant] as const;
}

export function useWorkspaceStorageSignedUrl(input: {
  storagePath: string;
  previewVariant: WorkspaceStoragePreviewVariant;
  enabled?: boolean;
}) {
  const path = input.storagePath.trim();

  return useQuery({
    queryKey: workspaceStorageSignedUrlQueryKey(path, input.previewVariant),
    queryFn: () => fetchWorkspaceStorageSignedUrl(path, input.previewVariant),
    enabled: input.enabled !== false && Boolean(path),
    staleTime: SIGNED_URL_STALE_MS,
    gcTime: SIGNED_URL_STALE_MS + 5 * 60 * 1000,
    retry: 1,
  });
}
