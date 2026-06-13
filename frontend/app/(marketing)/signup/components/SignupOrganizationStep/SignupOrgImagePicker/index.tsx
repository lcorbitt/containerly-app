"use client";

import { Trash2, Upload } from "lucide-react";
import { useSignupOrgImagePicker } from "./useSignupOrgImagePicker";

interface SignupOrgImagePickerProps {
  organizationName: string;
}

export function SignupOrgImagePicker({ organizationName }: SignupOrgImagePickerProps) {
  const picker = useSignupOrgImagePicker({ organizationName });

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
        aria-hidden={!picker.previewUrl}
      >
        {picker.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob preview URL
          <img src={picker.previewUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-lg font-semibold text-zinc-500 dark:text-zinc-400">
            {picker.initials}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Organization Logo</p>
        <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
          JPEG, PNG, WebP, or GIF. Up to 5&nbsp;MB. Uploaded when you finish sign-up.
        </p>
        {picker.message ? (
          <p className="text-xs text-red-600 dark:text-red-400" role="alert">
            {picker.message}
          </p>
        ) : null}
        <input
          ref={picker.inputRef}
          type="file"
          accept={picker.accept}
          className="sr-only"
          aria-label="Upload organization logo"
          onChange={(e) => picker.onPickFile(e.target.files)}
        />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={picker.triggerFilePicker}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Upload className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Upload Logo
          </button>
          {picker.hasPhoto ? (
            <button
              type="button"
              onClick={picker.removePhoto}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
