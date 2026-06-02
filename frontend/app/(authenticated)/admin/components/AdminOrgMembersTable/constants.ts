import type { OrgMemberInviteStatus } from "@/utils/org-member-invite-status";
import type { OrganizationMemberRole } from "@/types/database";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;

export const ROLE_OPTIONS: OrganizationMemberRole[] = ["admin", "member"];

export const ADMIN_ORG_MEMBER_INVITE_STATUS_CLASS: Record<OrgMemberInviteStatus, string> = {
  pending:
    "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
  accepted:
    "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
  direct:
    "inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};
