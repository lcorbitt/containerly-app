import type { LucideIcon } from "lucide-react";

export interface SideNavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  badgeCount?: number;
}
