"use client";

import { useCallback, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useToast } from "@/contexts/toast";
import { useOptionalSessionAvatar } from "@/contexts/session-avatar";
import { PROFILE_IMAGE_ACCEPT, assertProfileImageFile } from "@/lib/profile-image";
import {
  getProfileImagePublicUrlBrowser,
  clearProfileImagePathAndRemoveStorage,
  fetchProfileImagePath,
  uploadProfileImageAndSetPath,
} from "@/services/profile-browser.service";

type Props = {
  userId: string;
  initialProfileImagePath: string | null;
  /** For placeholder initials when no photo */
  displayLabel: string;
  /**
   * When true, vertical stack (avatar above actions) for use beside account fields;
   * omits the large “Profile photo” heading.
   */
  accountColumn?: boolean;
};

export function ProfileImageSettings({
  userId,
  initialProfileImagePath,
  displayLabel,
  accountColumn = false,
}: Props) {
  const { toast } = useToast();
  const sessionAvatar = useOptionalSessionAvatar();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialProfileImagePath);
  const [busy, setBusy] = useState(false);

  const publicUrl = getProfileImagePublicUrlBrowser(path);
  const initials = (displayLabel.trim().slice(0, 2) || "?").toUpperCase();

  const refreshPathFromDb = useCallback(async () => {
    const next = await fetchProfileImagePath(userId);
    setPath(next);
    sessionAvatar?.setProfileImagePath(next);
  }, [userId, sessionAvatar]);

  async function onPickFile(fileList: FileList | null) {
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
        userId,
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
  }

  async function removePhoto() {
    if (!path?.trim()) return;
    setBusy(true);
    const toRemove = path.trim();
    try {
      const { storageRemoved } = await clearProfileImagePathAndRemoveStorage({
        userId,
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
  }

  const controls = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_IMAGE_ACCEPT}
        className="sr-only"
        aria-label="Upload profile photo"
        onChange={(e) => void onPickFile(e.target.files)}
      />
      <div className={`flex flex-wrap items-center gap-2 ${accountColumn ? "" : "pt-1"}`}>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Upload className="h-4 w-4 opacity-80" aria-hidden />
          {path ? "Replace photo" : "Upload photo"}
        </button>
        {path ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void removePhoto()}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/70"
          >
            <Trash2 className="h-4 w-4 opacity-80" aria-hidden />
            Remove
          </button>
        ) : null}
      </div>
    </>
  );

  const avatar = (
    <div
      className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
      aria-hidden={!publicUrl}
    >
      {publicUrl ? (
        // Same pattern as attachment thumbnails: storage URL, not next/image.
        // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
        <img src={publicUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">{initials}</span>
      )}
    </div>
  );

  if (accountColumn) {
    return (
      <div className="flex w-full max-w-44 flex-col items-center gap-3 sm:items-start">
        <span className="sr-only">Profile photo</span>
        {avatar}
        <p className="hidden text-xs leading-relaxed text-zinc-600 sm:block dark:text-zinc-400">
          JPEG, PNG, WebP, or GIF. Up to 5&nbsp;MB.
        </p>
        {controls}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      {avatar}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Profile photo</p>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          JPEG, PNG, WebP, or GIF. Up to 5&nbsp;MB.
        </p>
        {controls}
      </div>
    </div>
  );
}
