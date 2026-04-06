"use client";

import { useCallback, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useToast } from "@/contexts/toast";
import { ORG_IMAGE_ACCEPT, assertOrgImageFile } from "@/lib/org-image";
import {
  getOrgImagePublicUrlBrowser,
  clearOrganizationImagePathAndRemoveStorage,
  fetchOrganizationImagePath,
  uploadOrganizationImageAndSetPath,
} from "@/services/organization-image-browser.service";

type Props = {
  organizationId: string;
  organizationName: string;
  initialOrgImagePath: string | null;
  onPathUpdated?: (path: string | null) => void;
};

export function OrganizationImageSettings({
  organizationId,
  organizationName,
  initialOrgImagePath,
  onPathUpdated,
}: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [path, setPath] = useState<string | null>(initialOrgImagePath);
  const [busy, setBusy] = useState(false);

  const publicUrl = getOrgImagePublicUrlBrowser(path);
  const initials = (organizationName.trim().slice(0, 2) || "?").toUpperCase();

  const refreshPathFromDb = useCallback(async () => {
    const next = await fetchOrganizationImagePath(organizationId);
    setPath(next);
    onPathUpdated?.(next);
  }, [organizationId, onPathUpdated]);

  async function onPickFile(fileList: FileList | null) {
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
      toast("Organization logo updated", "success");
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
      toast("Organization logo removed", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not remove logo", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-hidden={!publicUrl}
      >
        {publicUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase public object URL
          <img src={publicUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">{initials}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Organization logo</p>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          JPEG, PNG, WebP, or GIF. Up to 5&nbsp;MB. Shown in the app when this organization is active.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ORG_IMAGE_ACCEPT}
          className="sr-only"
          aria-label="Upload organization logo"
          onChange={(e) => void onPickFile(e.target.files)}
        />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4 opacity-80" aria-hidden />
            {path ? "Replace logo" : "Upload logo"}
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
      </div>
    </div>
  );
}
