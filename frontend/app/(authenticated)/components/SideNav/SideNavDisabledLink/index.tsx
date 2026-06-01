"use client";

import { ActionHoverTooltip } from "@/components/ActionHoverTooltip";
import { getSideNavDisabledLinkClassName } from "../utils";
import type { SideNavDisabledLinkProps } from "./types";

export function SideNavDisabledLink({ label, icon: Icon, tooltip }: SideNavDisabledLinkProps) {
  return (
    <ActionHoverTooltip label={tooltip} wrapperClassName="w-full">
      <span
        role="link"
        aria-disabled="true"
        className={getSideNavDisabledLinkClassName()}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
        <span className="min-w-0 wrap-break-word">{label}</span>
      </span>
    </ActionHoverTooltip>
  );
}
