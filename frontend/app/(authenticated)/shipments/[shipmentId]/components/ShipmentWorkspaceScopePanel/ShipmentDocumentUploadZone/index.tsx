"use client";

import { Loader2, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  MAX_ATTACHMENT_SIZE_LABEL,
  MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH,
} from "@/utils/workspace-files";
import {
  DOCUMENT_GROUP_SELECT_OPTIONS,
  DOCUMENT_TYPE_SELECT_OPTIONS,
  UPLOAD_ZONE_BODY_CLASS,
  UPLOAD_ZONE_BUTTON_CLASS,
  UPLOAD_ZONE_DRAG_CLASS,
  UPLOAD_ZONE_DROP_CLASS,
  UPLOAD_ZONE_IDLE_CLASS,
  UPLOAD_ZONE_METADATA_CLASS,
  UPLOAD_ZONE_SELECT_SHELL_CLASS,
} from "./constants";
import type { ShipmentDocumentUploadZoneProps } from "./types";

export type { ShipmentDocumentUploadGroup, ShipmentDocumentUploadZoneProps } from "./types";

export function ShipmentDocumentUploadZone({
  documentType,
  onDocumentTypeChange,
  documentGroup,
  onDocumentGroupChange,
  uploading = false,
  onUpload,
}: ShipmentDocumentUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const documentTypeSelectId = useId();
  const documentGroupSelectId = useId();

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length || uploading) return;
      void onUpload(Array.from(list));
    },
    [uploading, onUpload],
  );

  return (
    <div className={UPLOAD_ZONE_BODY_CLASS}>
      <div className={UPLOAD_ZONE_METADATA_CLASS}>
        <div>
          <span
            id={`${documentTypeSelectId}-label`}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Document type <span className="font-normal text-zinc-500">(optional)</span>
          </span>
          <div className={UPLOAD_ZONE_SELECT_SHELL_CLASS}>
            <CustomSelect
              id={documentTypeSelectId}
              aria-labelledby={`${documentTypeSelectId}-label`}
              value={documentType}
              onValueChange={onDocumentTypeChange}
              options={DOCUMENT_TYPE_SELECT_OPTIONS}
              showAvatars={false}
              placeholderLabel="None"
              disabled={uploading}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <span
            id={`${documentGroupSelectId}-label`}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
          >
            Document group
          </span>
          <div className={UPLOAD_ZONE_SELECT_SHELL_CLASS}>
            <CustomSelect
              id={documentGroupSelectId}
              aria-labelledby={`${documentGroupSelectId}-label`}
              value={documentGroup}
              onValueChange={(value) =>
                onDocumentGroupChange(value as ShipmentDocumentUploadZoneProps["documentGroup"])
              }
              options={DOCUMENT_GROUP_SELECT_OPTIONS}
              showAvatars={false}
              disabled={uploading}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading) setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading) setDragOver(true);
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
        className={`${UPLOAD_ZONE_DROP_CLASS} ${
          dragOver && !uploading ? UPLOAD_ZONE_DRAG_CLASS : UPLOAD_ZONE_IDLE_CLASS
        } ${dragOver && !uploading ? "ring-2 ring-inset ring-sky-400 dark:ring-sky-600" : ""}`}
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
          Up to {MAX_SHIPMENT_DOCUMENTS_UPLOAD_BATCH} files, {MAX_ATTACHMENT_SIZE_LABEL} each
        </p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`mt-4 ${UPLOAD_ZONE_BUTTON_CLASS}`}
        >
          {uploading ? (
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
          disabled={uploading}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
