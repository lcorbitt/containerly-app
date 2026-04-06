import { readApiJson } from "@/services/json-api";
import type { OrganizationMemberRole } from "@/types/database";

export type OrganizationMemberRecord = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  created_at: string;
};

export async function patchOrganizationMemberRole(
  membershipId: string,
  role: OrganizationMemberRole,
): Promise<OrganizationMemberRecord> {
  const res = await fetch(`/api/organization-members/${membershipId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const data = await readApiJson<{ membership?: OrganizationMemberRecord }>(res);
  if (!data.membership) throw new Error("Missing membership in response");
  return data.membership;
}

export async function inviteOrganizationMember(input: {
  organization_id: string;
  email: string;
  role: OrganizationMemberRole;
}): Promise<{ membership: { id: string }; invited: boolean }> {
  const res = await fetch("/api/organization-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      organization_id: input.organization_id,
      email: input.email.trim().toLowerCase(),
      role: input.role,
    }),
  });
  return readApiJson<{ membership: { id: string }; invited: boolean }>(res);
}
