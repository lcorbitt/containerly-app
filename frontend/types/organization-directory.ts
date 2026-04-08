import type { OrganizationMemberRole } from "@/types/database";

export type OrgMemberRow = {
  membershipId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};

export type OrganizationMemberRecord = {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationMemberRole;
  created_at: string;
};

export type AdminOrgMemberRow = {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: OrganizationMemberRole;
  createdAt: string;
};
