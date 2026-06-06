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
  }
> = {
  vessel: {
    node: "bg-blue-50 text-blue-700 ring-[#eff6ff] dark:bg-blue-950 dark:text-blue-200 dark:ring-zinc-950",
    connector: "bg-blue-400/55 dark:bg-blue-500/45",
    chip: "bg-blue-100/90 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(59,130,246,0.35)] dark:shadow-[0_0_24px_-6px_rgba(96,165,250,0.25)]",
  },
  port: {
    node: "bg-teal-50 text-teal-800 ring-[#f0fdfa] dark:bg-teal-950 dark:text-teal-200 dark:ring-zinc-950",
    connector: "bg-teal-400/50 dark:bg-teal-500/40",
    chip: "bg-teal-100/90 text-teal-900 dark:bg-teal-950/80 dark:text-teal-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(20,184,166,0.3)] dark:shadow-[0_0_24px_-6px_rgba(45,212,191,0.2)]",
  },
  land: {
    node: "bg-emerald-50 text-emerald-800 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-200 dark:ring-zinc-950",
    connector: "bg-emerald-400/50 dark:bg-emerald-500/38",
    chip: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(16,185,129,0.28)] dark:shadow-[0_0_24px_-6px_rgba(52,211,153,0.18)]",
  },
  customs: {
    node: "bg-amber-50 text-amber-900 ring-[#fffbeb] dark:bg-amber-950 dark:text-amber-100 dark:ring-zinc-950",
    connector: "bg-amber-400/50 dark:bg-amber-500/40",
    chip: "bg-amber-100/90 text-amber-950 dark:bg-amber-950/75 dark:text-amber-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(245,158,11,0.32)] dark:shadow-[0_0_24px_-6px_rgba(251,191,36,0.2)]",
  },
  system: {
    node: "bg-zinc-100 text-zinc-700 ring-white dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-950",
    connector: "bg-zinc-400/50 dark:bg-zinc-500/40",
    chip: "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    iconGlow: "shadow-[0_0_16px_-4px_rgba(113,113,122,0.25)]",
  },
  milestone: {
    node: "bg-violet-50 text-violet-800 ring-[#f5f3ff] dark:bg-violet-950 dark:text-violet-200 dark:ring-zinc-950",
    connector: "bg-violet-400/50 dark:bg-violet-500/38",
    chip: "bg-violet-100/90 text-violet-900 dark:bg-violet-950/80 dark:text-violet-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(139,92,246,0.28)] dark:shadow-[0_0_24px_-6px_rgba(167,139,250,0.2)]",
  },
  document: {
    node: "bg-sky-50 text-sky-800 ring-sky-50 dark:bg-sky-950 dark:text-sky-200 dark:ring-zinc-950",
    connector: "bg-sky-400/50 dark:bg-sky-500/38",
    chip: "bg-sky-100/90 text-sky-900 dark:bg-sky-950/80 dark:text-sky-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(14,165,233,0.28)] dark:shadow-[0_0_24px_-6px_rgba(56,189,248,0.2)]",
  },
  operatorMessage: {
    node: "bg-emerald-50 text-emerald-800 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-200 dark:ring-zinc-950",
    connector: "bg-emerald-400/50 dark:bg-emerald-500/38",
    chip: "bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(16,185,129,0.28)] dark:shadow-[0_0_24px_-6px_rgba(52,211,153,0.18)]",
  },
  customerMessage: {
    node: "bg-rose-50 text-rose-800 ring-[#fff1f2] dark:bg-rose-950 dark:text-rose-200 dark:ring-zinc-950",
    connector: "bg-rose-400/50 dark:bg-rose-500/38",
    chip: "bg-rose-100/90 text-rose-900 dark:bg-rose-950/80 dark:text-rose-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(244,63,94,0.28)] dark:shadow-[0_0_24px_-6px_rgba(251,113,133,0.18)]",
  },
  trackingNumber: {
    node: "bg-yellow-50 text-yellow-900 ring-[#fefce8] dark:bg-yellow-950 dark:text-yellow-100 dark:ring-zinc-950",
    connector: "bg-yellow-400/55 dark:bg-yellow-500/45",
    chip: "bg-yellow-100/90 text-yellow-950 dark:bg-yellow-950/75 dark:text-yellow-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(234,179,8,0.32)] dark:shadow-[0_0_24px_-6px_rgba(250,204,21,0.2)]",
  },
  shipmentCreated: {
    node: "bg-primary-orange/10 text-primary-orange ring-[#fff4ef] dark:bg-primary-orange/15 dark:text-primary-orange dark:ring-zinc-950",
    connector: "bg-primary-orange/45 dark:bg-primary-orange/40",
    chip: "bg-primary-orange/10 text-primary-orange dark:bg-primary-orange/15 dark:text-primary-orange",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(255,78,0,0.32)] dark:shadow-[0_0_24px_-6px_rgba(255,78,0,0.22)]",
  },
  success: {
    node: "bg-emerald-50 text-emerald-700 ring-[#ecfdf5] dark:bg-emerald-950 dark:text-emerald-300 dark:ring-zinc-950",
    connector: "bg-emerald-400/55 dark:bg-emerald-500/45",
    chip: "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-100",
    iconGlow: "shadow-[0_0_20px_-4px_rgba(16,185,129,0.32)] dark:shadow-[0_0_24px_-6px_rgba(52,211,153,0.2)]",
  },
};

/** Neutral card surface — tone color lives on the timeline node icon only. */
export const STEP_CARD_SURFACE =
  "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950";

export const STEP_CARD_BASE =
  "w-full rounded-md border px-2.5 py-2 text-left shadow-[0_1px_0_0_rgba(0,0,0,0.03)] ring-1 ring-slate-200/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)] dark:ring-slate-600/30 sm:px-3 sm:py-2.5";

export const TIMELINE_COMMUNICATION_PREVIEW_CLASS =
  "mt-0.5 line-clamp-3 text-sm font-medium leading-snug text-zinc-700 dark:text-zinc-300";

export const TIMELINE_DEFAULT_SUBTITLE_CLASS =
  "mt-0.5 text-[10px] font-medium text-zinc-500 dark:text-zinc-400";

export const TIMELINE_CARD_TIMESTAMP_CLASS =
  "shrink-0 text-[10px] tabular-nums leading-snug text-zinc-400 dark:text-zinc-500";

export const TIMELINE_CONNECTOR_PAST_CLASS =
  "bg-zinc-200/55 dark:bg-zinc-700/45";

export const TIMELINE_PAST_NODE_CLASS =
  "opacity-60 motion-safe:group-hover:opacity-75 motion-safe:group-hover:scale-100";

export const TIMELINE_LATEST_NODE_CLASS = "scale-105";

export const STEP_CARD_SURFACE_PAST =
  "border-zinc-200/60 bg-zinc-50/40 dark:border-zinc-800/60 dark:bg-zinc-950/40";

export const STEP_CARD_SURFACE_LATEST =
  "border-zinc-300 bg-white shadow-sm ring-1 ring-zinc-200/70 dark:border-zinc-700 dark:bg-zinc-950 dark:ring-zinc-600/40";

export const TIMELINE_LATEST_BADGE_CLASS =
  "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/80 dark:text-emerald-300 dark:ring-emerald-800/60";

export const TIMELINE_LATEST_BADGE_LABEL = "Current";
