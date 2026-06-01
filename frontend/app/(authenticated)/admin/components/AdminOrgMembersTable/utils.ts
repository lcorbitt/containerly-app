import type { AdminOrgMemberRow } from "@/types/organization-directory";
import type { OrgMemberInviteStatus } from "@/utils/org-member-invite-status";
import { orgMemberInviteStatusLabel } from "@/utils/org-member-invite-status";

export const ADMIN_ORG_MEMBER_INVITE_STATUS_CLASS: Record<OrgMemberInviteStatus, string> = {
  pending:
    "inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
  accepted:
    "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
  direct:
    "inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};

export function adminOrgMemberInviteStatusTitle(row: AdminOrgMemberRow): string | undefined {
  if (row.inviteStatus === "pending") {
    return row.invitedAt
      ? `Invited ${new Date(row.invitedAt).toLocaleString()} — awaiting email confirmation`
      : "Awaiting email confirmation";
  }
  if (row.inviteStatus === "accepted" && row.acceptedAt) {
    return `Accepted ${new Date(row.acceptedAt).toLocaleString()}`;
  }
  if (row.inviteStatus === "direct") {
    return "Added directly — no email invite was sent";
  }
  return undefined;
}

export function matchesAdminOrgMemberSearch(row: AdminOrgMemberRow, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    row.organizationName.toLowerCase().includes(s) ||
    (row.fullName?.toLowerCase().includes(s) ?? false) ||
    (row.email?.toLowerCase().includes(s) ?? false) ||
    row.userId.toLowerCase().includes(s) ||
    orgMemberInviteStatusLabel(row.inviteStatus).toLowerCase().includes(s)
  );
}

export function sortAdminOrgMemberRows(rows: AdminOrgMemberRow[]): AdminOrgMemberRow[] {
  return [...rows].sort((a, b) => {
    const byOrg = a.organizationName.localeCompare(b.organizationName);
    if (byOrg !== 0) return byOrg;
    const aLabel = a.fullName?.trim() || a.email || a.userId;
    const bLabel = b.fullName?.trim() || b.email || b.userId;
    return aLabel.localeCompare(bLabel);
  });
}

export function buildOrgOptionsFromRows(rows: AdminOrgMemberRow[]): { id: string; name: string }[] {
  const map = new Map<string, string>();
  for (const r of rows) {
    map.set(r.organizationId, r.organizationName);
  }
  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([id, name]) => ({ id, name }));
}
