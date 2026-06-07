import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface ShipmentDetailsSubCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}
