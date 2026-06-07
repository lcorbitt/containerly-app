import type { RefObject } from "react";
import type { Alert } from "@/types/database";

export interface NotificationsMenuProps {
  open: boolean;
  alerts: Alert[];
  unackedCount: number;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
  onMarkAllAsRead?: () => void;
  markingAllAsRead?: boolean;
}
