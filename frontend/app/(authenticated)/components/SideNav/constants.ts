import {
  BarChart2,
  Building2,
  CircleHelp,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
} from "lucide-react";

export const howItWorksNavItem = {
  href: "/container-details",
  label: "How it works",
  icon: CircleHelp,
} as const;

export const reportsNavItem = {
  label: "Reports",
  icon: BarChart2,
} as const;

export const REPORTS_NAV_DISABLED_TOOLTIP = "Coming soon!";

export const dashboardNavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
} as const;

export const shipmentsNavItem = {
  href: "/shipments",
  label: "Shipments",
  icon: Package,
} as const;

export const settingsNavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
} as const;

export const freightNavItems = [
  dashboardNavItem,
  shipmentsNavItem,
  settingsNavItem,
] as const;

export const importerNavItems = [shipmentsNavItem, settingsNavItem] as const;

export const adminNavItems = [
  { href: "/admin", label: "Users", icon: Shield },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
] as const;

export const SIDE_NAV_LINK_ACTIVE_CLASS =
  "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50";

export const SIDE_NAV_LINK_INACTIVE_CLASS =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100";

export const SIDE_NAV_LINK_DISABLED_CLASS =
  "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-zinc-600 dark:hover:text-zinc-400";
