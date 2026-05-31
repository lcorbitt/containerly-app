import { Box, Building2, LayoutDashboard, Package, Settings, Shield } from "lucide-react";

export const freightNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/container-details", label: "How it works", icon: Box },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const importerNavItems = [
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/container-details", label: "How it works", icon: Box },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export const adminNavItems = [
  { href: "/admin", label: "Users", icon: Shield },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
] as const;
