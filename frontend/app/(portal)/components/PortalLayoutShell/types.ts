import type { OrgMembershipRow } from "@/types/organization-workspace";

export interface PortalOperatorSession {
  userId: string;
  initialOrgs: OrgMembershipRow[];
  isSuperAdmin: boolean;
  initialProfileImagePath: string | null;
}

export interface PortalLayoutShellProps {
  operatorSession: PortalOperatorSession | null;
  children: React.ReactNode;
}
