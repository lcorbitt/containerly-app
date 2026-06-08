import type { ReactElement } from "react";

export type TooltipPlacement = "top" | "left";

export interface ActionHoverTooltipProps {
  label: string;
  /** Optional classes for multi-line/wide tooltip copy. */
  labelClassName?: string;
  /** Optional classes on the hover wrapper (e.g. flex-1 for equal-width tab slots). */
  wrapperClassName?: string;
  /** Where the tooltip sits relative to the trigger. Defaults to "top". */
  placement?: TooltipPlacement;
  children: ReactElement<{ "aria-describedby"?: string }>;
}
