"use client";

import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Anchor,
  Building2,
  Route,
  Clock,
  Code2,
  MapPin,
  Package,
  Shield,
  Ship,
  Truck,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import type { PublicTimelineEvent } from "@/types/public-report";

export function formatTimelineWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatTimelineWhenLong(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long",
      dateStyle: "full",
      timeStyle: "long",
    });
  } catch {
    return iso;
  }
}

function formatIsoUtc(iso: string) {
  try {
    return new Date(iso).toISOString();
  } catch {
    return iso;
  }
}

function formatRelativeWhen(iso: string): string {
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

const GENERIC_EVENT_TYPE = /^(SYNC|STATUS_UPDATE|STATUS|EVENT)$/i;

function humanizeCarrierToken(s: string): string {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function humanizeFieldKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function eventHeading(ev: PublicTimelineEvent): { title: string; subtitle: string | null } {
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

type TimelineTone = "vessel" | "port" | "land" | "customs" | "system" | "milestone";

function inferTimelineVisual(
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

const TONE_STYLES: Record<
  TimelineTone,
  {
    node: string;
    connector: string;
    cardBorder: string;
    cardBg: string;
    chip: string;
    iconGlow: string;
    /** Status-colored icon on black event modal */
    modalStatusIcon: string;
    /** Phase chip on black modal */
    modalChip: string;
  }
> = {
  vessel: {
    node: "bg-blue-50 text-blue-700 ring-[#eff6ff] dark:bg-blue-950 dark:text-blue-200 dark:ring-zinc-950",
    connector: "bg-blue-400/55 dark:bg-blue-500/45",
    cardBorder: "border-blue-200/60 dark:border-blue-900/45",
    cardBg: "bg-blue-50/50 dark:bg-blue-950/20",
    chip: "bg-blue-100/90 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(59,130,246,0.35)] dark:shadow-[0_0_24px_-6px_rgba(96,165,250,0.25)]",
    modalStatusIcon:
      "bg-blue-500/20 text-blue-300 ring-2 ring-blue-500/50 shadow-[0_0_28px_-6px_rgba(59,130,246,0.55)]",
    modalChip: "border border-blue-500/40 bg-blue-500/10 text-blue-200",
  },
  port: {
    node: "bg-teal-50 text-teal-800 ring-[#f0fdfa] dark:bg-teal-950 dark:text-teal-200 dark:ring-zinc-950",
    connector: "bg-teal-400/50 dark:bg-teal-500/40",
    cardBorder: "border-teal-200/55 dark:border-teal-900/40",
    cardBg: "bg-teal-50/50 dark:bg-teal-950/20",
    chip: "bg-teal-100/90 text-teal-900 dark:bg-teal-950/80 dark:text-teal-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(20,184,166,0.3)] dark:shadow-[0_0_24px_-6px_rgba(45,212,191,0.2)]",
    modalStatusIcon:
      "bg-teal-500/20 text-teal-200 ring-2 ring-teal-400/50 shadow-[0_0_28px_-6px_rgba(20,184,166,0.5)]",
    modalChip: "border border-teal-500/40 bg-teal-500/10 text-teal-100",
  },
  land: {
    node: "bg-emerald-50 text-emerald-800 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-200 dark:ring-zinc-950",
    connector: "bg-emerald-400/50 dark:bg-emerald-500/38",
    cardBorder: "border-emerald-200/55 dark:border-emerald-900/40",
    cardBg: "bg-emerald-50/50 dark:bg-emerald-950/18",
    chip: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(16,185,129,0.28)] dark:shadow-[0_0_24px_-6px_rgba(52,211,153,0.18)]",
    modalStatusIcon:
      "bg-emerald-500/20 text-emerald-200 ring-2 ring-emerald-400/50 shadow-[0_0_28px_-6px_rgba(16,185,129,0.5)]",
    modalChip: "border border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
  },
  customs: {
    node: "bg-amber-50 text-amber-900 ring-[#fffbeb] dark:bg-amber-950 dark:text-amber-100 dark:ring-zinc-950",
    connector: "bg-amber-400/50 dark:bg-amber-500/40",
    cardBorder: "border-amber-200/65 dark:border-amber-900/45",
    cardBg: "bg-amber-50/50 dark:bg-amber-950/18",
    chip: "bg-amber-100/90 text-amber-950 dark:bg-amber-950/75 dark:text-amber-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(245,158,11,0.32)] dark:shadow-[0_0_24px_-6px_rgba(251,191,36,0.2)]",
    modalStatusIcon:
      "bg-amber-500/20 text-amber-200 ring-2 ring-amber-400/50 shadow-[0_0_28px_-6px_rgba(245,158,11,0.5)]",
    modalChip: "border border-amber-500/40 bg-amber-500/10 text-amber-100",
  },
  system: {
    node: "bg-zinc-100 text-zinc-700 ring-white dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-950",
    connector: "bg-zinc-400/50 dark:bg-zinc-500/40",
    cardBorder: "border-zinc-200/90 dark:border-zinc-700/80",
    cardBg: "bg-zinc-50/80 dark:bg-zinc-900/35",
    chip: "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    iconGlow: "shadow-[0_0_16px_-4px_rgba(113,113,122,0.25)]",
    modalStatusIcon:
      "bg-zinc-500/25 text-zinc-100 ring-2 ring-zinc-400/45 shadow-[0_0_24px_-6px_rgba(161,161,170,0.35)]",
    modalChip: "border border-zinc-500/50 bg-zinc-500/15 text-zinc-200",
  },
  milestone: {
    node: "bg-violet-50 text-violet-800 ring-[#f5f3ff] dark:bg-violet-950 dark:text-violet-200 dark:ring-zinc-950",
    connector: "bg-violet-400/50 dark:bg-violet-500/38",
    cardBorder: "border-violet-200/55 dark:border-violet-900/40",
    cardBg: "bg-violet-50/50 dark:bg-violet-950/18",
    chip: "bg-violet-100/90 text-violet-900 dark:bg-violet-950/80 dark:text-violet-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(139,92,246,0.28)] dark:shadow-[0_0_24px_-6px_rgba(167,139,250,0.2)]",
    modalStatusIcon:
      "bg-violet-500/20 text-violet-200 ring-2 ring-violet-400/50 shadow-[0_0_28px_-6px_rgba(139,92,246,0.5)]",
    modalChip: "border border-violet-500/40 bg-violet-500/10 text-violet-100",
  },
};

function formatValueForDisplay(v: unknown): string {
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

function LocationDetails({
  location,
  compact,
}: {
  location: Record<string, unknown> | null;
  compact?: boolean;
}) {
  if (!location || Object.keys(location).length === 0) {
    return (
      <p className={compact ? "text-xs text-zinc-400" : "text-xs text-zinc-500 dark:text-zinc-400"}>
        {compact ? "None" : "No location on this update."}
      </p>
    );
  }
  const entries = Object.entries(location).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (compact) {
    return (
      <dl className="space-y-1">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-2 text-xs">
            <dt className="w-24 shrink-0 text-zinc-500">{humanizeFieldKey(k)}</dt>
            <dd className="min-w-0 wrap-break-word font-mono text-[11px] text-zinc-200">
              {formatValueForDisplay(v)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  const multiline = (v: unknown) =>
    typeof v === "object" && v !== null && (Array.isArray(v) ? true : Object.keys(v as object).length > 0);
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {entries.map(([k, v]) => (
        <div
          key={k}
          className={`rounded-lg border border-zinc-100 bg-zinc-50/90 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/50 ${multiline(v) ? "sm:col-span-2" : ""}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {humanizeFieldKey(k)}
          </p>
          <p className="mt-1 wrap-break-word font-mono text-[12px] leading-relaxed text-zinc-800 dark:text-zinc-200">
            {formatValueForDisplay(v)}
          </p>
        </div>
      ))}
    </div>
  );
}

function TimelineEventDetailModal({
  event,
  onClose,
}: {
  event: PublicTimelineEvent;
  onClose: () => void;
}) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const { tone, Icon, label } = inferTimelineVisual(event.event_type, event.status);
  const s = TONE_STYLES[tone];
  const { title, subtitle } = eventHeading(event);
  const relative = formatRelativeWhen(event.occurred_at);
  const rawPayload = event.raw_payload;
  const hasRaw =
    rawPayload != null && typeof rawPayload === "object" && Object.keys(rawPayload).length > 0;
  let rawJson = "";
  if (hasRaw) {
    try {
      rawJson = JSON.stringify(rawPayload, null, 2);
    } catch {
      rawJson = String(rawPayload);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-100 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={onBackdrop}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(85dvh,620px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-[0_1px_0_0_rgba(255,255,255,0.06)] sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
          <p className="text-xs font-medium text-zinc-400">Event details</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${s.modalStatusIcon}`}
              aria-hidden
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.modalChip}`}
                >
                  {label}
                </span>
                <span className="text-[11px] font-medium text-zinc-500">{relative}</span>
              </div>
              <h2 id={titleId} className="mt-1.5 text-base font-semibold leading-snug tracking-tight text-zinc-50">
                {title}
              </h2>
              {subtitle ? <p className="mt-0.5 text-xs font-medium text-zinc-400">{subtitle}</p> : null}
            </div>
          </div>

          <div className="mt-3 divide-y divide-zinc-800">
            <div className="pb-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">When</p>
              <p className="text-sm font-medium text-zinc-100">{formatTimelineWhenLong(event.occurred_at)}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                  {relative}
                </span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <code className="font-mono text-[10px] text-zinc-500">{formatIsoUtc(event.occurred_at)}</code>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 py-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Event type</p>
                <p className="mt-0.5 font-mono text-xs text-zinc-100">{event.event_type}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Status</p>
                {event.status ? (
                  <p className="mt-0.5 text-xs text-zinc-100">
                    <span className="font-medium">{humanizeCarrierToken(event.status)}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-zinc-500">{event.status}</span>
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-zinc-500">—</p>
                )}
              </div>
            </div>

            <div className="py-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Location</p>
              <LocationDetails compact location={event.location} />
            </div>

            <div className="grid grid-cols-1 gap-2 py-2.5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Event ID</p>
                <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-300">{event.id}</p>
              </div>
              {event.created_at ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Logged at</p>
                  <p className="mt-0.5 text-xs text-zinc-200">{formatTimelineWhen(event.created_at)}</p>
                  <code className="mt-0.5 block break-all font-mono text-[10px] text-zinc-500">
                    {formatIsoUtc(event.created_at)}
                  </code>
                </div>
              ) : null}
              {event.container_id ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Container ID</p>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-300">{event.container_id}</p>
                </div>
              ) : null}
              {event.tracking_request_id ? (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Tracking request
                  </p>
                  <p className="mt-0.5 break-all font-mono text-[10px] text-zinc-300">{event.tracking_request_id}</p>
                </div>
              ) : null}
            </div>

            {hasRaw ? (
              <details className="group pt-2.5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-zinc-300">
                  <Code2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                  Raw provider payload
                  <span className="text-[10px] font-normal text-zinc-500">(expand)</span>
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-md border border-zinc-800 bg-zinc-950 p-2 font-mono text-[10px] leading-relaxed text-zinc-300">
                  {rawJson}
                </pre>
              </details>
            ) : null}
          </div>

          {!hasRaw && !event.created_at && !event.container_id ? (
            <p className="mt-2 text-center text-[11px] leading-snug text-zinc-500">
              Shared link: only public fields are shown.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

function formatLocationSnippet(loc: Record<string, unknown>): string | null {
  const keys = ["last_location", "name", "city", "port", "country", "location", "facility", "terminal", "code"];
  for (const k of keys) {
    const v = loc[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  const first = Object.entries(loc).find(([, v]) => v != null && String(v).trim());
  return first ? `${first[0]}: ${String(first[1])}` : null;
}

const STEP_CARD_BASE =
  "w-full rounded-lg border px-2.5 py-2 text-left shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)] sm:px-3 sm:py-2.5";

const STEP_CARD_INTERACTIVE =
  "cursor-pointer transition-[border-color,box-shadow,transform] duration-200 motion-safe:hover:border-zinc-300/90 motion-safe:hover:shadow-md motion-safe:active:scale-[0.99] dark:motion-safe:hover:border-zinc-600/90";

function TimelineStepCard({
  interactive,
  onOpenDetail,
  className,
  children,
}: {
  interactive: boolean;
  onOpenDetail: () => void;
  className: string;
  children: ReactNode;
}) {
  if (interactive) {
    return (
      <button
        type="button"
        onClick={onOpenDetail}
        className={`${STEP_CARD_BASE} ${STEP_CARD_INTERACTIVE} ${className}`}
      >
        {children}
      </button>
    );
  }
  return <div className={`${STEP_CARD_BASE} ${className}`}>{children}</div>;
}

export type ContainerTimelineProps = {
  events: PublicTimelineEvent[];
  /** When false, cards are not clickable (public report). Default true for team views. */
  interactiveDetail?: boolean;
  /** Omit the titled header row when embedding inside another shell (e.g. tabbed request page). */
  hideHeader?: boolean;
  /** Merged onto the outer section (e.g. `rounded-none border-0` inside a tab panel). */
  className?: string;
};

export function ContainerTimeline({
  events,
  interactiveDetail = true,
  hideHeader = false,
  className: classNameProp,
}: ContainerTimelineProps) {
  const [detailEvent, setDetailEvent] = useState<PublicTimelineEvent | null>(null);

  return (
    <section
      className={`overflow-hidden rounded-xl bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${classNameProp ?? ""}`}
      aria-label="Journey timeline"
    >
      {interactiveDetail && detailEvent ? (
        <TimelineEventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
      ) : null}

      {hideHeader ? null : (
        <div className="border-b border-zinc-100 bg-transparent px-4 py-3.5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-400/70 bg-transparent text-zinc-600 dark:border-zinc-500 dark:text-zinc-400">
                <Route className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Journey timeline
                </h2>
                <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  What the carrier reported, in order
                </p>
              </div>
            </div>
            {events.length > 0 ? (
              <span className="rounded-full border border-zinc-200/80 bg-white px-2.5 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                {events.length} event{events.length !== 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </div>
      )}

      <div className={`p-3 sm:p-4 ${hideHeader ? "pt-4" : ""}`}>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/30">
            <MapPin className="h-8 w-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No events recorded yet</p>
            <p className="max-w-xs text-xs text-zinc-500 dark:text-zinc-500">
              Synced carrier updates will appear here as your shipment moves.
            </p>
          </div>
        ) : (
          <div className="relative">
            <ol className="relative list-none py-1">
              {events.map((ev, index) => {
                const { tone, Icon, label } = inferTimelineVisual(ev.event_type, ev.status);
                const s = TONE_STYLES[tone];
                const isLast = index === events.length - 1;
                const relative = formatRelativeWhen(ev.occurred_at);
                const { title, subtitle } = eventHeading(ev);
                const locSnippet =
                  ev.location && Object.keys(ev.location).length > 0
                    ? formatLocationSnippet(ev.location)
                    : null;

                return (
                  <li key={ev.id} className="group mb-8 last:mb-0">
                    <div className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3">
                      {index > 0 ? (
                        <span
                          className="pointer-events-none absolute -top-8 bottom-1/2 left-[1.25rem] z-0 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-700"
                          aria-hidden
                        />
                      ) : null}
                      {!isLast ? (
                        <span
                          className="pointer-events-none absolute top-1/2 -bottom-8 left-[1.25rem] z-0 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-700"
                          aria-hidden
                        />
                      ) : null}
                      <div className="relative z-10 flex justify-center">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition-[transform,box-shadow] duration-200 motion-safe:group-hover:scale-[1.03] dark:ring-offset-zinc-950 ${s.node} ${s.iconGlow}`}
                          aria-hidden
                        >
                          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2} />
                        </div>
                      </div>
                      <div className="relative z-10 min-w-0">
                        <TimelineStepCard
                          interactive={interactiveDetail}
                          onOpenDetail={() => setDetailEvent(ev)}
                          className={`w-full max-w-none ${s.cardBorder} ${s.cardBg}`}
                        >
                        <div className="flex flex-wrap items-center gap-1 gap-y-0.5">
                          <span
                            className={`inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${s.chip}`}
                          >
                            {label}
                          </span>
                          <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            {relative}
                          </span>
                        </div>
                        <p className="mt-1 text-[13px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                          {title}
                        </p>
                        {subtitle ? (
                          <p className="mt-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                            {subtitle}
                          </p>
                        ) : null}
                        <p className="mt-1 font-mono text-[10px] leading-tight text-zinc-500 dark:text-zinc-500">
                          {formatTimelineWhen(ev.occurred_at)}
                        </p>
                        {locSnippet || (ev.location && Object.keys(ev.location).length > 0) ? (
                          <div className="mt-1.5 border-t border-zinc-200/50 pt-1.5 dark:border-zinc-700/50">
                            {locSnippet ? (
                              <p className="flex items-start gap-1 text-[10px] leading-snug text-zinc-600 dark:text-zinc-400">
                                <MapPin
                                  className="mt-0.5 h-2.5 w-2.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                                  strokeWidth={2}
                                  aria-hidden
                                />
                                <span className="line-clamp-3">{locSnippet}</span>
                              </p>
                            ) : (
                              <p className="line-clamp-2 font-mono text-[9px] leading-snug text-zinc-600 dark:text-zinc-400">
                                {JSON.stringify(ev.location)}
                              </p>
                            )}
                          </div>
                        ) : null}
                        </TimelineStepCard>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
