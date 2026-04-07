import type { ReportMessage } from "@/types/database";

export function threadMessageAuthorName(
  m: ReportMessage,
  nameByUserId: Record<string, string>,
): string {
  if (m.author_kind === "system") return "System";
  if (m.author_kind === "customer") return m.author_display_name?.trim() || "Importer";
  const stored = m.author_display_name?.trim();
  if (stored) return stored;
  if (m.author_user_id && nameByUserId[m.author_user_id]) return nameByUserId[m.author_user_id]!;
  return "Team member";
}
