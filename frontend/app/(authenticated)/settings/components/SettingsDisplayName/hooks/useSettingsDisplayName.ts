"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/atoms/toast";
import { updateProfileFullName } from "@/services/profile.service";

export const DISPLAY_NAME_MAX_LEN = 200;

export function useSettingsDisplayName({ initialFullName }: { initialFullName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState(initialFullName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(initialFullName);
  }, [initialFullName]);

  const trimmed = value.trim();
  const unchanged = trimmed === initialFullName.trim();

  async function save() {
    if (trimmed.length > DISPLAY_NAME_MAX_LEN) {
      toast(`Name is too long (max ${DISPLAY_NAME_MAX_LEN} characters).`, "error");
      return;
    }
    if (unchanged) return;

    setSaving(true);
    try {
      await updateProfileFullName(trimmed.length > 0 ? trimmed : null);
      toast("Name updated", "success");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update name", "error");
    } finally {
      setSaving(false);
    }
  }

  return { value, setValue, saving, unchanged, save };
}
