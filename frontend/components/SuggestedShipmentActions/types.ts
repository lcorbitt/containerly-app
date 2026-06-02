import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";

export interface SuggestedShipmentActionsProps {
  actions: SuggestedShipmentAction[];
  onAction: (action: SuggestedShipmentAction) => void;
}
