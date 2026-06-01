/**
 * Fixed height for authenticated workspace tab panels (~7 timeline steps before inner scroll).
 * Same for container request workspace and shipment overview. See `container-timeline.tsx` for step spacing.
 */
const WORKSPACE_TAB_PANEL_TOOLBAR_REM = 4.5;
const WORKSPACE_TAB_PANEL_TIMELINE_CHROME_REM = 4.25;
const WORKSPACE_TAB_PANEL_STEP_BLOCK_REM = 6.5;
const WORKSPACE_TAB_PANEL_STEP_GAP_REM = 2;

const WORKSPACE_TAB_PANEL_SCROLL_REM =
  WORKSPACE_TAB_PANEL_TIMELINE_CHROME_REM +
  7 * WORKSPACE_TAB_PANEL_STEP_BLOCK_REM +
  6 * WORKSPACE_TAB_PANEL_STEP_GAP_REM;

export const WORKSPACE_TAB_PANEL_HEIGHT_CSS = `calc(${WORKSPACE_TAB_PANEL_TOOLBAR_REM}rem + ${WORKSPACE_TAB_PANEL_SCROLL_REM}rem)`;

export function workspaceTabButtonClass(active: boolean): string {
  return `flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-center text-sm transition-colors ${
    active
      ? "border-zinc-900 font-bold text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
      : "border-transparent font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
  }`;
}
