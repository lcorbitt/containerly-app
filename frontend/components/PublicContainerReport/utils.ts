import type { PublicThreadMessage } from "@/types/public-report";

export function publicThreadAuthorName(m: PublicThreadMessage): string {
  if (m.author_kind === "system") return "System";
  if (m.author_kind === "customer") return m.author_display_name?.trim() || "Importer";
  if (m.author_kind === "member") return m.author_display_name?.trim() || "Logistics team";
  return m.author_kind;
}

export function formatFreshness(freshnessMinutes: number | null | undefined): string {
  if (freshnessMinutes == null) return "unknown";
  if (freshnessMinutes < 120) return `${freshnessMinutes} min ago`;
  return `${Math.round(freshnessMinutes / 60)} h ago`;
}
