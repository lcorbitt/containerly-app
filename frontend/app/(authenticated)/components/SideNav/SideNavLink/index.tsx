"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSideNavLinkClassName } from "../utils";
import type { SideNavLinkProps } from "./types";

export function SideNavLink({ href, label, icon: Icon, active, badgeCount = 0 }: SideNavLinkProps) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const pending = pendingHref === href && !active;

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  return (
    <Link
      href={href}
      data-nav-label={label}
      onClick={() => {
        if (!active) setPendingHref(href);
      }}
      className={`relative ${getSideNavLinkClassName(active, pending)}`}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
      <span className="min-w-0 wrap-break-word">{label}</span>
      {badgeCount > 0 ? (
        <span className="absolute right-2 top-1/2 flex h-[1.125rem] min-w-[1.125rem] -translate-y-1/2 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white dark:bg-red-500">
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
    </Link>
  );
}
