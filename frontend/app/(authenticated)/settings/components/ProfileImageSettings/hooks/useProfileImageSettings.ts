"use client";

import { useCallback, useRef, useState } from "react";
import { useToast } from "@/contexts/toast";
import { useOptionalSessionAvatar } from "@/contexts/session-avatar";
import { assertProfileImageFile } from "@/utils/profile-image";
import {
  getProfileImagePublicUrlBrowser,
  clearProfileImagePathAndRemoveStorage,
  fetchProfileImagePath,
  uploadProfileImageAndSetPath,
} from "@/services/profile.service";

export function useProfileImageSettings({
  initialProfileImagePath,
  displayLabel,
}: {
  initialProfileImagePath: string | null;
  displayLabel: string;
}) {
  const { toast } = useToast();
  const sessionAvatar = useOptionalSessionAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialProfileImagePath);
  const [busy, setBusy] = useState(false);

  const publicUrl = getProfileImagePublicUrlBrowser(path);
  const initials = (displayLabel.trim().slice(0, 2) || "?").toUpperCase();

  const refreshPathFromDb = useCallback(async () => {
    const next = await fetchProfileImagePath();
    setPath(next);
    sessionAvatar?.setProfileImagePath(next);
  }, [sessionAvatar]);

  const onPickFile = useCallback(
    async (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      try {
        assertProfileImageFile(file);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Invalid image", "error");
        return;
      }

      setBusy(true);
      const previousPath = path;
      try {
        const objectPath = await uploadProfileImageAndSetPath({
          file,
          previousPath,
        });

        setPath(objectPath);
        sessionAvatar?.setProfileImagePath(objectPath);
        toast("Profile photo updated", "success");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "error");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [path, sessionAvatar, toast],
  );

  const removePhoto = useCallback(async () => {
    if (!path?.trim()) return;
    setBusy(true);
    const toRemove = path.trim();
    try {
      const { storageRemoved } = await clearProfileImagePathAndRemoveStorage({
        storagePath: toRemove,
      });
      if (!storageRemoved) {
        await refreshPathFromDb();
        toast("Photo removed from profile; storage file may still exist.", "info");
        return;
      }

      setPath(null);
      sessionAvatar?.setProfileImagePath(null);
      toast("Profile photo removed", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove photo", "error");
    } finally {
      setBusy(false);
    }
  }, [path, sessionAvatar, refreshPathFromDb, toast]);

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
