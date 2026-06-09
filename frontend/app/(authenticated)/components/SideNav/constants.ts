import {
  Anchor,
  BarChart2,
  Box,
  Building2,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  Settings,
  Ship,
  TriangleAlert,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

/** Sidenav active + hover — same border and background in both states. */
export const SIDE_NAV_LINK_SURFACE_CLASS =
  "border-zinc-200 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-950";

export const SIDE_NAV_LINK_HOVER_SURFACE_CLASS =
  "border border-transparent bg-transparent hover:border-zinc-200 hover:bg-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-950";

export const dashboardNavItem = {
  href: "/dashboard",
  label: "Dashboard",
  icon: LayoutDashboard,
} as const;

export const alertsNavItem = {
  href: "/alerts",
  label: "Alerts",
  icon: TriangleAlert,
} as const;

export const shipmentsNavItem = {
  href: "/shipments",
  label: "Shipments",
  icon: Package,
} as const;

export const containersNavItem = {
  href: "/containers",
  label: "Containers",
  icon: Box,
} as const;

export const documentsNavItem = {
  href: "/documents",
  label: "Documents",
  icon: FileText,
} as const;

export const customersNavItem = {
  href: "/customers",
  label: "Customers",
  icon: Users,
} as const;

export const automationsNavItem = {
  href: "/automations",
  label: "Automations",
  icon: Zap,
} as const;

export const reportsNavItem = {
  href: "/reports",
  label: "Reports",
  icon: BarChart2,
} as const;

export const settingsNavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
} as const;

export const helpNavItem = {
  label: "Help & Support",
  icon: HelpCircle,
} as const;

export const toolsNavGroup = {
  label: "Tools",
  icon: Wrench,
  items: [
    { href: "/vessel-finder", label: "Vessel Finder", icon: Ship },
    { href: "/port-finder", label: "Port Finder", icon: Anchor },
    { href: "/terminal-finder", label: "Terminal Finder", icon: MapPin },
  ],
} as const;

export const freightNavItems = [
  dashboardNavItem,
  shipmentsNavItem,
  alertsNavItem,
  containersNavItem,
  documentsNavItem,
  customersNavItem,
  settingsNavItem,
] as const;

export const importerNavItems = [shipmentsNavItem, settingsNavItem] as const;

export const adminNavItems = [
  { href: "/admin", label: "Users", icon: Users },
  { href: "/admin/invites", label: "Invites", icon: Mail },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
] as const;

export const SIDE_NAV_LINK_ACTIVE_CLASS = `text-zinc-700 dark:text-zinc-200 border ${SIDE_NAV_LINK_SURFACE_CLASS}`;

export const SIDE_NAV_LINK_INACTIVE_CLASS = `text-zinc-600 dark:text-zinc-400 ${SIDE_NAV_LINK_HOVER_SURFACE_CLASS}`;

export const SIDE_NAV_LINK_DISABLED_CLASS =
  "cursor-not-allowed opacity-45 hover:border-transparent hover:bg-transparent dark:hover:border-transparent";

export const SIDE_NAV_SECTION_LABEL_CLASS =
  "mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400";

export const SIDE_NAV_SUB_LINK_CLASS =
  "flex min-h-0 w-full items-center gap-3 rounded-md py-3 pl-10 pr-4 text-xs font-medium leading-tight transition";

export const SIDE_NAV_SUB_LINK_ACTIVE_CLASS = `text-zinc-700 dark:text-zinc-200 border ${SIDE_NAV_LINK_SURFACE_CLASS}`;

export const SIDE_NAV_SUB_LINK_INACTIVE_CLASS = `text-zinc-600 dark:text-zinc-400 ${SIDE_NAV_LINK_HOVER_SURFACE_CLASS}`;
