import type { Organization } from "@/types/database";

export type OrgMembershipRow = {
  role: string;
  organizations: Organization | null;
};
