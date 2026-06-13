"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSignupDraft } from "@/atoms/signup-draft";
import { assertOrgImageFile, ORG_IMAGE_ACCEPT } from "@/utils/org-image";

interface UseSignupOrgImagePickerInput {
  organizationName: string;
}

export function useSignupOrgImagePicker({ organizationName }: UseSignupOrgImagePickerInput) {
  const { orgImageFile, setOrgImageFile } = useSignupDraft();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!orgImageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(orgImageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [orgImageFile]);

  const initials = (organizationName.trim().slice(0, 2) || "?").toUpperCase();

  const onPickFile = useCallback(
    (fileList: FileList | null) => {
      setMessage(null);
      const file = fileList?.[0];
      if (!file) return;
      try {
        assertOrgImageFile(file);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Invalid image");
        return;
      }
      setOrgImageFile(file);
    },
    [setOrgImageFile],
  );

  const removePhoto = useCallback(() => {
    setOrgImageFile(null);
    setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [setOrgImageFile]);

  const triggerFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    inputRef,
    previewUrl,
    initials,
    message,
    hasPhoto: Boolean(orgImageFile),
    onPickFile,
    removePhoto,
    triggerFilePicker,
    accept: ORG_IMAGE_ACCEPT,
  };
}
