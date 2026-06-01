import type { LucideIcon } from "lucide-react";
import { getSideNavLinkClassName } from "../utils";

export interface SideNavPanelTriggerProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  badgeCount?: number;
  ariaControls: string;
  triggerId: string;
  onClick: () => void;
}

export function SideNavPanelTrigger({
  label,
  icon: Icon,
  active,
  badgeCount = 0,
  ariaControls,
  triggerId,
  onClick,
}: SideNavPanelTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative cursor-pointer text-left ${getSideNavLinkClassName(active)}`}
      aria-expanded={active}
      aria-controls={ariaControls}
      id={triggerId}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      <span className="min-w-0 wrap-break-word">{label}</span>
      {badgeCount > 0 ? (
        <span className="absolute right-2 top-1/2 flex h-[1.125rem] min-w-[1.125rem] -translate-y-1/2 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white dark:bg-red-500">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
    </button>
  );
}
