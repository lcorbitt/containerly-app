import type { ModalSize } from "./types";

/** Full-viewport stacking layer for the modal. Override via `overlayClassName` for nested stacking. */
export const MODAL_OVERLAY_CLASS = "fixed inset-0 z-[100]";

/** Centers the panel on desktop, anchors to the bottom on small screens, and allows tall content to scroll. */
export const MODAL_SHELL_CLASS =
  "relative flex h-full min-h-0 w-full items-end justify-center overflow-y-auto sm:items-center sm:p-4";

export const MODAL_BACKDROP_CLASS =
  "absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] transition-opacity dark:bg-black/70";

export const MODAL_PANEL_BASE_CLASS =
  "relative z-10 m-0 flex max-h-full w-full flex-col border-0 bg-white shadow-2xl outline-none dark:bg-zinc-950 sm:max-h-[90vh] sm:rounded-2xl sm:border sm:border-zinc-200 dark:sm:border-zinc-700";

export const MODAL_SIZE_CLASS: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
};

/** Wraps the (optionally blurred) header + body region so an `overlay` can sit above it. */
export const MODAL_CONTENT_WRAPPER_CLASS = "relative flex min-h-0 flex-1 flex-col";

export const MODAL_CONTENT_BLUR_CLASS = "pointer-events-none blur-[2px] opacity-60";

export const MODAL_HEADER_CLASS =
  "flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800";

export const MODAL_HEADER_TEXT_CLASS = "min-w-0";

export const MODAL_HEADER_ACTIONS_CLASS = "flex shrink-0 items-center gap-2";

export const MODAL_TITLE_CLASS =
  "text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50";

export const MODAL_DESCRIPTION_CLASS = "mt-1 text-xs text-zinc-500 dark:text-zinc-400";

export const MODAL_BODY_CLASS = "min-h-0 flex-1 overflow-y-auto px-5 py-4";

export const MODAL_FOOTER_CLASS =
  "flex shrink-0 items-center justify-end gap-2 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800";
