"use client";

import { useState } from "react";
import { useToast } from "@/contexts/toast";
import {
  notifyPasswordChanged,
  reauthenticateWithPassword,
  updatePassword,
} from "@/services/auth.service";
import { PASSWORD_SETTINGS_MIN_LENGTH, PASSWORD_SETTINGS_SUCCESS_TOAST } from "./constants";

export function usePasswordSettingsPanel() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (newPassword.length < PASSWORD_SETTINGS_MIN_LENGTH) {
      toast(`Password must be at least ${PASSWORD_SETTINGS_MIN_LENGTH} characters.`, "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast("New passwords do not match.", "error");
      return;
    }
    if (!currentPassword) {
      toast("Enter your current password.", "error");
      return;
    }

    setSaving(true);
    try {
      const reauth = await reauthenticateWithPassword(currentPassword);
      if (reauth.error) throw reauth.error;

      const updated = await updatePassword(newPassword);
      if (updated.error) throw updated.error;

      const notify = await notifyPasswordChanged();
      if (notify.error) {
        console.warn("[settings] password notification failed", notify.error.message);
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast(PASSWORD_SETTINGS_SUCCESS_TOAST, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update password", "error");
    } finally {
      setSaving(false);
    }
  }

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    saving,
    save,
  };
}
