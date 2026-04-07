import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Anchor,
  Building2,
  MapPin,
  Package,
  Shield,
  Ship,
  Truck,
} from "lucide-react";
import { formatTimestamp } from "@/utils/datetime";
import type { PublicTimelineEvent } from "@/types/public-report";
import type { TimelineTone } from "./types";
import { GENERIC_EVENT_TYPE } from "./constants";

/** Absolute clock time on timeline cards and related UI (matches messages / activity). */
export function formatTimelineWhen(iso: string) {
  return formatTimestamp(iso);
}

export function formatIsoUtc(iso: string) {
  try {
    return new Date(iso).toISOString();
  } catch {
    return iso;
  }
}

export function formatRelativeWhen(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    const diffMs = Date.now() - d;
    const abs = Math.abs(diffMs);
    const mins = Math.round(abs / 60000);
    if (mins < 1) return diffMs >= 0 ? "Just now" : "Soon";
    if (mins < 60) return diffMs >= 0 ? `${mins}m ago` : `in ${mins}m`;
    const hrs = Math.round(mins / 60);
    if (hrs < 48) return diffMs >= 0 ? `${hrs}h ago` : `in ${hrs}h`;
    const days = Math.round(hrs / 24);
    if (days < 14) return diffMs >= 0 ? `${days}d ago` : `in ${days}d`;
    return diffMs >= 0 ? `${Math.round(days / 7)}w ago` : `in ${Math.round(days / 7)}w`;
  } catch {
    return "";
  }
}

export function humanizeCarrierToken(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function humanizeFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export function eventHeading(ev: PublicTimelineEvent): { title: string; subtitle: string | null } {
  const et = ev.event_type.trim();
  const st = ev.status?.trim() ?? null;

  if (st && GENERIC_EVENT_TYPE.test(et)) {
    return { title: humanizeCarrierToken(st), subtitle: null };
  }
  if (st && st.toUpperCase() !== et.toUpperCase()) {
    return { title: humanizeCarrierToken(st), subtitle: et };
  }
  if (st) {
    return { title: et, subtitle: humanizeCarrierToken(st) };
  }
  return { title: et, subtitle: null };
}

export function inferTimelineVisual(
  eventType: string,
  status: string | null,
): { tone: TimelineTone; Icon: LucideIcon; label: string } {
  const t = `${eventType} ${status ?? ""}`.toLowerCase();

  if (/custom|clearance|hold|inspect|exam|cfs|bond|quarantine|detain/.test(t)) {
    return { tone: "customs", Icon: Shield, label: "Customs" };
  }
  if (/load|gate.?out|empty|depart|sail|ocean|vessel|feeder|transship|onboard|shipped|in_transit|at_sea/.test(t)) {
    return { tone: "vessel", Icon: Ship, label: "At Sea" };
  }
  if (/arriv|berth|port|discharg|unload|ingate|destination|delivered|pod|discharge|anchored/.test(t)) {
    return { tone: "port", Icon: Anchor, label: "Port" };
  }
  if (/rail|truck|haul|dray|cartage|on.?carriage|door|pickup|delivery/.test(t)) {
    return { tone: "land", Icon: Truck, label: "Inland" };
  }
  if (/warehouse|depot|yard|storage|terminal/.test(t)) {
    return { tone: "land", Icon: Building2, label: "Facility" };
  }
  if (/packed|carton|sku|package|unit/.test(t)) {
    return { tone: "milestone", Icon: Package, label: "Cargo" };
  }
  if (/sync|status_update|status\b|poll|telemetry|webhook|heartbeat/.test(t)) {
    return { tone: "system", Icon: Activity, label: "Feed" };
  }

  return { tone: "milestone", Icon: MapPin, label: "Milestone" };
}

export function formatValueForDisplay(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string") return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function formatLocationSnippet(loc: Record<string, unknown>): string | null {
  const keys = ["last_location", "name", "city", "port", "country", "location", "facility", "terminal", "code"];
  for (const k of keys) {
    const v = loc[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  const first = Object.entries(loc).find(([, v]) => v != null && String(v).trim());
  return first ? `${first[0]}: ${String(first[1])}` : null;
}
