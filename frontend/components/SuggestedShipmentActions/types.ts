import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";

export interface SuggestedShipmentActionsProps {
  actions: SuggestedShipmentAction[];
  onAction: (action: SuggestedShipmentAction) => void;
  /** `card` — nested sub-card. `standalone` — top-level full-width card body. `chips` — compact pill row. */
  variant?: "card" | "standalone" | "chips";
}
