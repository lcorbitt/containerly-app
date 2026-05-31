import { Building2, CircleHelp, LayoutDashboard, Package, Settings, Shield } from "lucide-react";

export const howItWorksNavItem = {
  href: "/container-details",
  label: "How it works",
  icon: CircleHelp,
} as const;

export const freightNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const importerNavItems = [
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const adminNavItems = [
  { href: "/admin", label: "Users", icon: Shield },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
] as const;
