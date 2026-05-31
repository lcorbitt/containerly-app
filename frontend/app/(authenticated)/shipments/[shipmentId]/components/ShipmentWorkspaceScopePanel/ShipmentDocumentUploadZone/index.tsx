"use client";

import { Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { MAX_ATTACHMENT_SIZE_LABEL } from "@/utils/workspace-files";
import {
  UPLOAD_ZONE_BASE_CLASS,
  UPLOAD_ZONE_BUTTON_CLASS,
  UPLOAD_ZONE_DRAG_CLASS,
  UPLOAD_ZONE_IDLE_CLASS,
} from "./constants";

interface ShipmentDocumentUploadZoneProps {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function ShipmentDocumentUploadZone({
  disabled = false,
  onFilesSelected,
}: ShipmentDocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length || disabled) return;
      onFilesSelected(Array.from(list));
    },
    [disabled, onFilesSelected],
  );

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`${UPLOAD_ZONE_BASE_CLASS} min-h-[168px] ${
        dragOver && !disabled ? UPLOAD_ZONE_DRAG_CLASS : UPLOAD_ZONE_IDLE_CLASS
      }`}
    >
      <Upload
        className="h-9 w-9 text-zinc-400 dark:text-zinc-500"
        strokeWidth={1.75}
        aria-hidden
      />
      <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        Upload or drag and drop files here
      </p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Up to {MAX_ATTACHMENT_SIZE_LABEL} per file
      </p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={`mt-4 ${UPLOAD_ZONE_BUTTON_CLASS}`}
      >
        {disabled ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" strokeWidth={2} aria-hidden />
            Upload
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        aria-label="Upload files from computer"
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
