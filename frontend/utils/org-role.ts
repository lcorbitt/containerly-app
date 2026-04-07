import type { OrganizationMemberRole } from "@/types/database";

export const ORG_ADMIN_ROLE: OrganizationMemberRole = "admin";

export function isOrgAdminMembershipRole(role: string | null | undefined): boolean {
  return role === ORG_ADMIN_ROLE;
}

/** Superadmins act in org context without a membership row; tenant admins use `organization_members.role = admin`. */
export function canManageOrganizationSettings(
  isSuperAdmin: boolean,
  membershipRole: string | null | undefined,
): boolean {
  return isSuperAdmin || isOrgAdminMembershipRole(membershipRole);
}
