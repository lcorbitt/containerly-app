import type { TimelineTone } from "./types";

export const TIMELINE_ORDER_FADE_MS = 200;

export const GENERIC_EVENT_TYPE = /^(SYNC|STATUS_UPDATE|STATUS|EVENT)$/i;

export const TONE_STYLES: Record<
  TimelineTone,
  {
    node: string;
    connector: string;
    chip: string;
    iconGlow: string;
    latestCard: string;
  }
> = {
  vessel: {
    node: "bg-blue-50 text-blue-700 ring-[#eff6ff] dark:bg-blue-950 dark:text-blue-200 dark:ring-zinc-950",
    connector: "bg-blue-400/55 dark:bg-blue-500/45",
    chip: "bg-blue-100/90 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(59,130,246,0.45)] dark:shadow-[0_0_26px_-4px_rgba(96,165,250,0.35)]",
    latestCard:
      "border-l-[3px] border-l-blue-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(59,130,246,0.24)] ring-1 ring-blue-200/55 dark:border-l-blue-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(59,130,246,0.16)] dark:ring-blue-900/45",
  },
  port: {
    node: "bg-teal-50 text-teal-800 ring-[#f0fdfa] dark:bg-teal-950 dark:text-teal-200 dark:ring-zinc-950",
    connector: "bg-teal-400/50 dark:bg-teal-500/40",
    chip: "bg-teal-100/90 text-teal-900 dark:bg-teal-950/80 dark:text-teal-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(20,184,166,0.4)] dark:shadow-[0_0_26px_-4px_rgba(45,212,191,0.28)]",
    latestCard:
      "border-l-[3px] border-l-teal-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(20,184,166,0.22)] ring-1 ring-teal-200/55 dark:border-l-teal-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(20,184,166,0.14)] dark:ring-teal-900/45",
  },
  land: {
    node: "bg-emerald-50 text-emerald-800 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-200 dark:ring-zinc-950",
    connector: "bg-emerald-400/50 dark:bg-emerald-500/38",
    chip: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(16,185,129,0.38)] dark:shadow-[0_0_26px_-4px_rgba(52,211,153,0.26)]",
    latestCard:
      "border-l-[3px] border-l-emerald-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(16,185,129,0.22)] ring-1 ring-emerald-200/55 dark:border-l-emerald-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(16,185,129,0.14)] dark:ring-emerald-900/45",
  },
  customs: {
    node: "bg-amber-50 text-amber-900 ring-[#fffbeb] dark:bg-amber-950 dark:text-amber-100 dark:ring-zinc-950",
    connector: "bg-amber-400/50 dark:bg-amber-500/40",
    chip: "bg-amber-100/90 text-amber-950 dark:bg-amber-950/75 dark:text-amber-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(245,158,11,0.42)] dark:shadow-[0_0_26px_-4px_rgba(251,191,36,0.28)]",
    latestCard:
      "border-l-[3px] border-l-amber-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(245,158,11,0.22)] ring-1 ring-amber-200/55 dark:border-l-amber-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(245,158,11,0.14)] dark:ring-amber-900/45",
  },
  system: {
    node: "bg-zinc-100 text-zinc-700 ring-white dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-950",
    connector: "bg-zinc-400/50 dark:bg-zinc-500/40",
    chip: "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    iconGlow: "shadow-[0_0_18px_-2px_rgba(113,113,122,0.35)] dark:shadow-[0_0_22px_-4px_rgba(161,161,170,0.22)]",
    latestCard:
      "border-l-[3px] border-l-zinc-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(113,113,122,0.18)] ring-1 ring-zinc-300/55 dark:border-l-zinc-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(113,113,122,0.12)] dark:ring-zinc-700/45",
  },
  milestone: {
    node: "bg-violet-50 text-violet-800 ring-[#f5f3ff] dark:bg-violet-950 dark:text-violet-200 dark:ring-zinc-950",
    connector: "bg-violet-400/50 dark:bg-violet-500/38",
    chip: "bg-violet-100/90 text-violet-900 dark:bg-violet-950/80 dark:text-violet-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(139,92,246,0.38)] dark:shadow-[0_0_26px_-4px_rgba(167,139,250,0.26)]",
    latestCard:
      "border-l-[3px] border-l-violet-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(139,92,246,0.22)] ring-1 ring-violet-200/55 dark:border-l-violet-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(139,92,246,0.14)] dark:ring-violet-900/45",
  },
  document: {
    node: "bg-sky-50 text-sky-800 ring-sky-50 dark:bg-sky-950 dark:text-sky-200 dark:ring-zinc-950",
    connector: "bg-sky-400/50 dark:bg-sky-500/38",
    chip: "bg-sky-100/90 text-sky-900 dark:bg-sky-950/80 dark:text-sky-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(14,165,233,0.38)] dark:shadow-[0_0_26px_-4px_rgba(56,189,248,0.26)]",
    latestCard:
      "border-l-[3px] border-l-sky-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(14,165,233,0.22)] ring-1 ring-sky-200/55 dark:border-l-sky-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(14,165,233,0.14)] dark:ring-sky-900/45",
  },
  operatorMessage: {
    node: "bg-emerald-50 text-emerald-800 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-200 dark:ring-zinc-950",
    connector: "bg-emerald-400/50 dark:bg-emerald-500/38",
    chip: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(16,185,129,0.38)] dark:shadow-[0_0_26px_-4px_rgba(52,211,153,0.26)]",
    latestCard:
      "border-l-[3px] border-l-emerald-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(16,185,129,0.22)] ring-1 ring-emerald-200/55 dark:border-l-emerald-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(16,185,129,0.14)] dark:ring-emerald-900/45",
  },
  customerMessage: {
    node: "bg-rose-50 text-rose-800 ring-[#fff1f2] dark:bg-rose-950 dark:text-rose-200 dark:ring-zinc-950",
    connector: "bg-rose-400/50 dark:bg-rose-500/38",
    chip: "bg-rose-100/90 text-rose-900 dark:bg-rose-950/80 dark:text-rose-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(244,63,94,0.38)] dark:shadow-[0_0_26px_-4px_rgba(251,113,133,0.26)]",
    latestCard:
      "border-l-[3px] border-l-rose-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(244,63,94,0.22)] ring-1 ring-rose-200/55 dark:border-l-rose-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(244,63,94,0.14)] dark:ring-rose-900/45",
  },
  trackingNumber: {
    node: "bg-yellow-50 text-yellow-900 ring-[#fefce8] dark:bg-yellow-950 dark:text-yellow-100 dark:ring-zinc-950",
    connector: "bg-yellow-400/55 dark:bg-yellow-500/45",
    chip: "bg-yellow-100/90 text-yellow-950 dark:bg-yellow-950/75 dark:text-yellow-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(234,179,8,0.42)] dark:shadow-[0_0_26px_-4px_rgba(250,204,21,0.28)]",
    latestCard:
      "border-l-[3px] border-l-yellow-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(234,179,8,0.22)] ring-1 ring-yellow-200/55 dark:border-l-yellow-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(234,179,8,0.14)] dark:ring-yellow-900/45",
  },
  shipmentCreated: {
    node: "bg-primary-orange/10 text-primary-orange ring-[#fff4ef] dark:bg-primary-orange/15 dark:text-primary-orange dark:ring-zinc-950",
    connector: "bg-primary-orange/45 dark:bg-primary-orange/40",
    chip: "bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/15 dark:text-primary-orange",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(255,78,0,0.42)] dark:shadow-[0_0_26px_-4px_rgba(255,78,0,0.3)]",
    latestCard:
      "border-l-[3px] border-l-primary-orange border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(255,78,0,0.22)] ring-1 ring-primary-orange/25 dark:border-l-primary-orange dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(255,78,0,0.14)] dark:ring-primary-orange/30",
  },
  success: {
    node: "bg-emerald-50 text-emerald-700 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-300 dark:ring-zinc-950",
    connector: "bg-emerald-400/55 dark:bg-emerald-500/45",
    chip: "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_22px_-2px_rgba(16,185,129,0.42)] dark:shadow-[0_0_26px_-4px_rgba(52,211,153,0.28)]",
    latestCard:
      "border-l-[3px] border-l-emerald-500 border-zinc-200/80 bg-white shadow-[0_4px_18px_-8px_rgba(16,185,129,0.24)] ring-1 ring-emerald-200/55 dark:border-l-emerald-400 dark:border-zinc-700/80 dark:bg-zinc-950 dark:shadow-[0_4px_18px_-8px_rgba(16,185,129,0.16)] dark:ring-emerald-900/45",
  },
};

/** Neutral card surface — tone color lives on the timeline node icon only. */
export const STEP_CARD_SURFACE =
  "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

export const STEP_CARD_BASE =
  "flex w-full flex-col gap-2 rounded-md border px-2.5 py-2 text-left shadow-[0_1px_0_0_rgba(0,0,0,0.03)] ring-1 ring-slate-200/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)] dark:ring-slate-600/30 sm:px-3 sm:py-2.5";

export const TIMELINE_COMMUNICATION_PREVIEW_CLASS =
  "line-clamp-3 text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-300";

export const TIMELINE_DEFAULT_SUBTITLE_CLASS =
  "text-[10px] font-medium text-zinc-500 dark:text-zinc-400";

export const TIMELINE_CARD_TIMESTAMP_CLASS =
  "shrink-0 text-[10px] tabular-nums leading-snug text-zinc-400 dark:text-zinc-500";

export const TIMELINE_LATEST_TIMESTAMP_CLASS =
  "shrink-0 text-[10px] font-medium tabular-nums leading-snug text-zinc-600 dark:text-zinc-300";

export const TIMELINE_CONNECTOR_PAST_CLASS =
  "bg-zinc-200/55 dark:bg-zinc-700/45";

export const TIMELINE_PAST_NODE_CLASS =
  "opacity-55 motion-safe:group-hover:opacity-70 motion-safe:group-hover:scale-100";

export const TIMELINE_LATEST_NODE_CLASS = "scale-110 ring-[3px] ring-offset-[3px]";

export const STEP_CARD_SURFACE_PAST =
  "border-zinc-200/45 bg-zinc-50/20 saturate-[0.88] dark:border-zinc-800/45 dark:bg-zinc-950/25";

export const TIMELINE_EVENT_ELEMENT_ID_PREFIX = "shipment-timeline-event-";
