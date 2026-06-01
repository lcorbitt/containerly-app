/**
 * Mirrors `supabase/functions/_shared/reportInsights.ts` (used by public report payload).
 * If you change risk rules or headline copy, update both places.
 */

export type RiskLevel = "low" | "medium" | "high";

export function riskFromStatus(status: string | null | undefined): RiskLevel {
  const s = (status ?? "").toUpperCase();
  if (s.includes("EXCEPTION") || s.includes("CUSTOMS_HOLD") || s.includes("HELD")) return "high";
  if (s.includes("DELAY") || s.includes("LATE") || s.includes("ROLLED")) return "medium";
  return "low";
}

export function headlineFromSummary(args: {
  status: string | null;
  risk: RiskLevel;
  freshnessMinutes: number | null;
}): string {
  const { status, risk, freshnessMinutes } = args;
  if (freshnessMinutes != null && freshnessMinutes > 24 * 60) {
    return "Data may be stale — last carrier update was over a day ago.";
  }
  if (risk === "high") {
    return "Exception or hold reported — review timeline and alerts.";
  }
  if (risk === "medium") {
    return "Possible delay — confirm ETA with carrier or terminal.";
  }
  return `Current carrier-reported status 1: ${status ?? "unknown"}.`;
}

export function freshnessMinutesFromSync(lastSyncedAt: string | null | undefined): number | null {
  if (!lastSyncedAt) return null;
  return Math.round((Date.now() - new Date(lastSyncedAt).getTime()) / 60000);
}

export function computePublicReportInsights(args: {
  carrierReportedStatus: string | null;
  lastSyncedAt: string | null | undefined;
}): { risk_level: RiskLevel; headline: string; freshness_minutes: number | null } {
  const freshness_minutes = freshnessMinutesFromSync(args.lastSyncedAt ?? null);
  const status = args.carrierReportedStatus;
  const risk = riskFromStatus(status);
  return {
    risk_level: risk,
    headline: headlineFromSummary({ status, risk, freshnessMinutes: freshness_minutes }),
    freshness_minutes,
  };
}

export function riskInsightBadgeClass(level: string): string {
  if (level === "high") return "bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-100";
  if (level === "medium") return "bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100";
  return "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100";
}
