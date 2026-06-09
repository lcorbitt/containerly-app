"use client";

import { useState } from "react";
import { useToast } from "@/contexts/toast";
import { useCreateAdminTenantInviteMutation } from "@/hooks/mutations/useOnboarding";
import {
  ADMIN_INVITES_INPUT_CLASS,
  INVITE_NEW_TENANT_EMAIL_LABEL,
  INVITE_NEW_TENANT_SUBMIT_LABEL,
  INVITE_NEW_TENANT_SUGGESTED_NAME_LABEL,
  INVITE_NEW_TENANT_SUGGESTED_NAME_PLACEHOLDER,
} from "../AdminInvitesPanel/constants";

export function useInviteNewTenantForm() {
  const { toast } = useToast();
  const mutation = useCreateAdminTenantInviteMutation();
  const [email, setEmail] = useState("");
  const [suggestedOrgName, setSuggestedOrgName] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const emailLower = email.trim().toLowerCase();
    if (!emailLower.includes("@")) {
      toast("Valid email is required.", "error");
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        email: emailLower,
        suggestedOrgName: suggestedOrgName.trim() || null,
      });
      setEmail("");
      setSuggestedOrgName("");
      toast(result.invited ? "Tenant invite sent" : "Tenant invite recorded", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not send tenant invite", "error");
    }
  }

  return {
    email,
    setEmail,
    suggestedOrgName,
    setSuggestedOrgName,
    loading: mutation.isPending,
    submit,
    emailLabel: INVITE_NEW_TENANT_EMAIL_LABEL,
    suggestedNameLabel: INVITE_NEW_TENANT_SUGGESTED_NAME_LABEL,
    suggestedNamePlaceholder: INVITE_NEW_TENANT_SUGGESTED_NAME_PLACEHOLDER,
    submitLabel: INVITE_NEW_TENANT_SUBMIT_LABEL,
    inputClass: ADMIN_INVITES_INPUT_CLASS,
  };
}
