import type { AdminOrgMemberRow } from "@/types/organization-directory";

export function matchesAdminOrgMemberSearch(row: AdminOrgMemberRow, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    row.organizationName.toLowerCase().includes(s) ||
    (row.fullName?.toLowerCase().includes(s) ?? false) ||
    (row.email?.toLowerCase().includes(s) ?? false) ||
    row.userId.toLowerCase().includes(s)
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
