import type { RefObject } from "react";
import type { Alert } from "@/types/database";

export interface CustomerNotificationsMenuProps {
  open: boolean;
  alerts: Alert[];
  unackedCount: number;
  menuRef: RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onClose: () => void;
}
