import type { Profile } from "@/types/database";

export type AdminProfileRow = Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at"> & {
  organizations_label: string;
};

export function matchesAdminProfileSearch(row: AdminProfileRow, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    (row.email?.toLowerCase().includes(s) ?? false) ||
    (row.full_name?.toLowerCase().includes(s) ?? false) ||
    row.id.toLowerCase().includes(s) ||
    row.organizations_label.toLowerCase().includes(s)
  );
}

export function sortAdminProfileRows(rows: AdminProfileRow[]): AdminProfileRow[] {
  return [...rows].sort((a, b) =>
    (a.full_name?.trim() || a.email || a.id).localeCompare(b.full_name?.trim() || b.email || b.id),
  );
}
