import type { AdminFeedbackListRow } from "@/services/feedback.service";

export function formatFeedbackDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatSubmitter(row: AdminFeedbackListRow): string {
  const name = row.submitter_full_name?.trim();
  const email = row.submitter_email?.trim();
  if (name && email) return `${name} (${email})`;
  return name || email || row.user_id.slice(0, 8);
}

export function truncateMessage(message: string, max = 120): string {
  const trimmed = message.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function matchesFeedbackSearch(row: AdminFeedbackListRow, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [
    row.message,
    row.submitter_email,
    row.submitter_full_name,
    row.organization_name,
    row.page_url,
    row.category,
    row.status,
    row.user_id,
  ]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q));
}
