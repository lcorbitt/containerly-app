import type { TimelineTone } from "./types";

export const TIMELINE_ORDER_FADE_MS = 200;

export const GENERIC_EVENT_TYPE = /^(SYNC|STATUS_UPDATE|STATUS|EVENT)$/i;

export const TONE_STYLES: Record<
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

export const STEP_CARD_BASE =
  "w-full rounded-md border px-2.5 py-2 text-left shadow-[0_1px_0_0_rgba(0,0,0,0.03)] ring-1 ring-slate-200/40 dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)] dark:ring-slate-600/30 sm:px-3 sm:py-2.5";

export const STEP_CARD_INTERACTIVE =
  "cursor-pointer transition-[border-color,box-shadow,transform] duration-200 motion-safe:hover:border-zinc-300/90 motion-safe:hover:shadow-md motion-safe:active:scale-[0.99] dark:motion-safe:hover:border-zinc-600/90";
