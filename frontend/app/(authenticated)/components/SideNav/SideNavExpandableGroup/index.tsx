"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getSideNavLinkClassName } from "../utils";
import {
  SIDE_NAV_SUB_LINK_ACTIVE_CLASS,
  SIDE_NAV_SUB_LINK_CLASS,
  SIDE_NAV_SUB_LINK_INACTIVE_CLASS,
} from "../constants";
import { isSideNavLinkActive } from "../utils";
import type { SideNavExpandableGroupProps } from "./types";

export function SideNavExpandableGroup({
  label,
  icon: Icon,
  items,
  expanded,
  onToggle,
  pathname,
}: SideNavExpandableGroupProps) {
  const childActive = items.some((item) => isSideNavLinkActive(pathname, item.href));

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={onToggle}
        className={`cursor-pointer text-left ${getSideNavLinkClassName(childActive || expanded)}`}
        aria-expanded={expanded}
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
        <span className="min-w-0 flex-1 wrap-break-word">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 opacity-70 transition-transform ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="flex flex-col gap-1">
          {items.map(({ href, label: itemLabel, icon: ItemIcon }) => {
            const active = isSideNavLinkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                data-nav-label={itemLabel}
                className={`${SIDE_NAV_SUB_LINK_CLASS} ${
                  active ? SIDE_NAV_SUB_LINK_ACTIVE_CLASS : SIDE_NAV_SUB_LINK_INACTIVE_CLASS
                }`}
                aria-current={active ? "page" : undefined}
              >
                <ItemIcon className="h-3.5 w-3.5 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                <span className="min-w-0 wrap-break-word">{itemLabel}</span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
