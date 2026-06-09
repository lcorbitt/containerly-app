import type { LucideIcon } from "lucide-react";

export interface SideNavExpandableGroupItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SideNavExpandableGroupProps {
  label: string;
  icon: LucideIcon;
  items: readonly SideNavExpandableGroupItem[];
  expanded: boolean;
  onToggle: () => void;
  pathname: string;
}
