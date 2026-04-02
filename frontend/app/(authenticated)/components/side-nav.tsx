"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Box,
  Building2,
  Hash,
  LayoutDashboard,
  MapPinned,
  Settings,
  Shield,
  Ship,
  Warehouse,
} from "lucide-react";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/container-details", label: "Container Details", icon: Box },
  { href: "/container-numbers", label: "Container Numbers", icon: Hash },
  {
    href: "/live-vessel-tracking",
    label: "Live Vessel Tracking",
    icon: Ship,
  },
  { href: "/vessel-finder", label: "Vessel Finder", icon: Anchor },
  { href: "/port-finder", label: "Port Finder", icon: MapPinned },
  { href: "/terminal-finder", label: "Terminal Finder", icon: Warehouse },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SideNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav
        className="flex h-full min-h-0 flex-1 flex-col p-3"
        aria-label="Main"
      >
        <div className="flex shrink-0 flex-col gap-1">
        {mainNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
              {label}
            </Link>
          );
        })}
        </div>

        <div className="min-h-0 flex-1" aria-hidden />

        {isSuperAdmin ? (
          <div className="shrink-0 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <p className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Platform
            </p>
            <p className="mb-2 px-3 text-[10px] leading-snug text-zinc-500 dark:text-zinc-500">
              RLS bypass — not an org role
            </p>
            <div className="flex flex-col gap-0.5">
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === "/admin"
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                <Shield className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
                Users
              </Link>
              <Link
                href="/admin/organizations"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin/organizations")
                    ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                }`}
                aria-current={pathname.startsWith("/admin/organizations") ? "page" : undefined}
              >
                <Building2 className="h-5 w-5 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
                Organizations
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
