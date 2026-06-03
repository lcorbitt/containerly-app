import { isOrgAdminMembershipRole } from "@/utils/org-role";

export type AccountRoleLabel = "Admin" | "Operator" | "Customer";

export interface AccountRoleInput {
  isSuperAdmin: boolean;
  membershipRole: string | null | undefined;
  isCustomer: boolean;
}

/**
 * Human-facing role label for the profile menu. Customer wins (they have no operator
 * surface); otherwise platform superadmins and org admins read as "Admin", and any
 * other signed-in operator reads as "Operator".
 */
export function accountRoleLabel({
  isSuperAdmin,
  membershipRole,
  isCustomer,
}: AccountRoleInput): AccountRoleLabel {
  if (isCustomer) return "Customer";
  if (isSuperAdmin || isOrgAdminMembershipRole(membershipRole)) return "Admin";
  return "Operator";
}
