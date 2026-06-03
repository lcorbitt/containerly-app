import type { OrgMembershipRow } from "@/types/organization-workspace";

export interface AuthenticatedAppShellProps {
  userId: string;
  email: string;
  fullName: string | null;
  initialProfileImagePath: string | null;
  initialOrgs: OrgMembershipRow[];
  isSuperAdmin: boolean;
  isCustomer: boolean;
  children: React.ReactNode;
}
