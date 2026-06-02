import {
  BarChart2,
  Building2,
  CircleHelp,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
} from "lucide-react";
import { AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_EMPHASIZED_SURFACE_CLASS } from "@/components/TopNav/AuthenticatedTopNav/constants";

/** Sidenav hover — same borders as top-nav utility buttons, slightly darker fill than zinc-50 / zinc-900. */
export const SIDE_NAV_LINK_HOVER_SURFACE_CLASS =
  "border border-transparent bg-transparent hover:border-zinc-200 hover:bg-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-950";

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

export const SIDE_NAV_LINK_ACTIVE_CLASS = `text-zinc-700 dark:text-zinc-200 ${AUTHENTICATED_TOP_NAV_UTILITY_BUTTON_EMPHASIZED_SURFACE_CLASS}`;

export const SIDE_NAV_LINK_INACTIVE_CLASS = `text-zinc-600 dark:text-zinc-400 ${SIDE_NAV_LINK_HOVER_SURFACE_CLASS}`;

export const SIDE_NAV_LINK_DISABLED_CLASS =
  "cursor-not-allowed opacity-45 hover:border-transparent hover:bg-transparent dark:hover:border-transparent";
