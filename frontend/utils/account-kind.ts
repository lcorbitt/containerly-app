export type AccountKind = "operator" | "customer";

export interface CustomerAccountInput {
  accountKind: string | null | undefined;
  isSuperAdmin: boolean;
  hasOrgMembership: boolean;
}

/**
 * Strict customer classification: a user is a customer ONLY when their profile is
 * labeled `customer` AND they have no org membership AND they are not a superadmin.
 * If any signal indicates operator, treat as operator. Shared by the (authenticated)
 * and (customer) layout guards so their redirects can never disagree.
 */
export function isCustomerAccount({
  accountKind,
  isSuperAdmin,
  hasOrgMembership,
}: CustomerAccountInput): boolean {
  if (isSuperAdmin) return false;
  if (hasOrgMembership) return false;
  return accountKind === "customer";
}
