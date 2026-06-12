export type RiskLevel = "low" | "medium" | "high";

export function riskFromStatus(status: string | null | undefined): RiskLevel {
  const s = (status ?? "").toUpperCase();
  if (s.includes("EXCEPTION") || s.includes("CUSTOMS_HOLD") || s.includes("HELD")) return "high";
  if (s.includes("DELAY") || s.includes("LATE") || s.includes("ROLLED")) return "medium";
  return "low";
}

export function resolveShipmentRiskLevel(
  operatorLevel: string | null | undefined,
  computed: RiskLevel,
): RiskLevel {
  if (operatorLevel === "low" || operatorLevel === "medium" || operatorLevel === "high") return operatorLevel;
  return computed;
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
  return `Current carrier-reported status 2: ${status ?? "unknown"}.`;
}
