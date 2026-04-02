"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Building2, ClipboardList, LayoutDashboard, Settings, Shield } from "lucide-react";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/container-details", label: "Container Details", icon: Box },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function SideNav({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const pathname = usePathname();

  const linkClass = (active: boolean) =>
    `flex min-h-0 items-center gap-4 rounded-md p-4 text-xs font-medium leading-tight transition-colors ${
      active
        ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
    }`;

  return (
    <aside className="box-border flex h-full min-h-0 w-54 shrink-0 flex-col overflow-hidden border-r border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/80">
      <nav
        className="flex h-full min-h-0 flex-1 flex-col justify-between overflow-hidden p-2"
        aria-label="Main"
      >
        <div className="flex min-h-0 flex-col gap-2">
          {mainNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={linkClass(active)}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                <span className="min-w-0 wrap-break-word">{label}</span>
              </Link>
            );
          })}
        </div>

        {isSuperAdmin ? (
          <div
            className="shrink-0 border-t border-zinc-200 pt-2 dark:border-zinc-800"
            title="Platform role bypasses RLS; not an organization membership."
          >
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              Platform
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin"
                className={linkClass(pathname === "/admin")}
                aria-current={pathname === "/admin" ? "page" : undefined}
              >
                <Shield className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                Users
              </Link>
              <Link
                href="/admin/organizations"
                className={linkClass(pathname.startsWith("/admin/organizations"))}
                aria-current={
                  pathname.startsWith("/admin/organizations") ? "page" : undefined
                }
              >
                <Building2 className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                Organizations
              </Link>
            </div>
          </div>
        ) : (
          <div className="shrink-0" aria-hidden />
        )}
      </nav>
    </aside>
  );
}
