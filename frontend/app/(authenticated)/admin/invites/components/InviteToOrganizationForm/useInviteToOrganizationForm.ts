"use client";

import { useState } from "react";
import { useToast } from "@/contexts/toast";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useInviteOrganizationMemberMutation } from "@/hooks/mutations/useOrganization";
import type { OrganizationMemberRole } from "@/types/database";
import {
  ADMIN_INVITES_INPUT_CLASS,
  INVITE_TO_ORG_EMAIL_LABEL,
  INVITE_TO_ORG_ORG_LABEL,
  INVITE_TO_ORG_ROLE_LABEL,
  INVITE_TO_ORG_SUBMIT_LABEL,
} from "../AdminInvitesPanel/constants";

const ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "member"];

export function useInviteToOrganizationForm() {
  const { toast } = useToast();
  const { orgs } = useOrganizationWorkspace();
  const mutation = useInviteOrganizationMemberMutation();

  const [organizationId, setOrganizationId] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrganizationMemberRole>("member");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const orgId = organizationId.trim();
    const emailLower = email.trim().toLowerCase();
    if (!orgId) {
      toast("Select an organization.", "error");
      return;
    }
    if (!emailLower.includes("@")) {
      toast("Valid email is required.", "error");
      return;
    }

    try {
      const result = await mutation.mutateAsync({
        organization_id: orgId,
        email: emailLower,
        role,
      });
      setEmail("");
      toast(
        result.invited ? "Invite sent" : "Member added",
        "success",
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not invite member", "error");
    }
  }

  return {
    orgs,
    organizationId,
    setOrganizationId,
    email,
    setEmail,
    role,
    setRole,
    roleOptions: ROLE_OPTIONS,
    loading: mutation.isPending,
    submit,
    emailLabel: INVITE_TO_ORG_EMAIL_LABEL,
    orgLabel: INVITE_TO_ORG_ORG_LABEL,
    roleLabel: INVITE_TO_ORG_ROLE_LABEL,
    submitLabel: INVITE_TO_ORG_SUBMIT_LABEL,
    inputClass: ADMIN_INVITES_INPUT_CLASS,
  };
}
