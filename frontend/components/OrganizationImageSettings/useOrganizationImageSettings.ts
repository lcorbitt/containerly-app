"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/atoms/toast";
import {
  organizationImageQueryKey,
  useOrganizationImageQuery,
} from "@/hooks/queries/useOrganization";
import {
  clearOrganizationImagePathAndRemoveStorage,
  getOrgImagePublicUrlBrowser,
  getOrganizationImage,
  uploadOrganizationImageAndSetPath,
} from "@/services/organization.service";
import { assertOrgImageFile } from "@/utils/org-image";

export function useOrganizationImageSettings({
  organizationId,
  organizationName,
  initialOrgImagePath,
  onPathUpdated,
}: {
  organizationId: string;
  organizationName: string;
  initialOrgImagePath: string | null;
  onPathUpdated?: (path: string | null) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orgImageQuery = useOrganizationImageQuery(organizationId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialOrgImagePath);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (orgImageQuery.data !== undefined) {
      setPath(orgImageQuery.data);
    }
  }, [orgImageQuery.data]);

  useEffect(() => {
    setPath(initialOrgImagePath);
  }, [initialOrgImagePath, organizationId]);

  const publicUrl = getOrgImagePublicUrlBrowser(path);
  const initials = (organizationName.trim().slice(0, 2) || "?").toUpperCase();

  const refreshPathFromDb = useCallback(async () => {
    const next = await queryClient.fetchQuery({
      queryKey: organizationImageQueryKey(organizationId),
      queryFn: () => getOrganizationImage(organizationId),
    });
    setPath(next);
    onPathUpdated?.(next);
  }, [organizationId, onPathUpdated, queryClient]);

  const onPickFile = useCallback(
    async (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      try {
        assertOrgImageFile(file);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Invalid image", "error");
        return;
      }

      setBusy(true);
      const previousPath = path;
      try {
        const objectPath = await uploadOrganizationImageAndSetPath({
          organizationId,
          file,
          previousPath,
        });

        setPath(objectPath);
        onPathUpdated?.(objectPath);
        void queryClient.invalidateQueries({
          queryKey: organizationImageQueryKey(organizationId),
        });
        toast("Organization logo updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [path, organizationId, onPathUpdated, queryClient, toast],
  );

  const removePhoto = useCallback(async () => {
    if (!path?.trim()) return;
    setBusy(true);
    const toRemove = path.trim();
    try {
      const { storageRemoved } = await clearOrganizationImagePathAndRemoveStorage({
        organizationId,
        storagePath: toRemove,
      });
      if (!storageRemoved) {
        await refreshPathFromDb();
        toast("Logo removed from organization; storage file may still exist.", "info");
        return;
      }

      setPath(null);
      onPathUpdated?.(null);
      void queryClient.invalidateQueries({
        queryKey: organizationImageQueryKey(organizationId),
      });
      toast("Organization logo removed", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove logo", "error");
    } finally {
      setBusy(false);
    }
  }, [path, organizationId, onPathUpdated, queryClient, refreshPathFromDb, toast]);

  const triggerFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    inputRef,
    path,
    busy,
    publicUrl,
    initials,
    onPickFile,
    removePhoto,
    triggerFilePicker,
  };
}
