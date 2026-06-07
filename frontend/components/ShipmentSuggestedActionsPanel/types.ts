import type { SuggestedShipmentActionsProps } from "@/components/SuggestedShipmentActions/types";
import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";
import type { ShipmentActionAudience, SuggestShipmentActionsInput } from "@/utils/shipment-actions";

export interface ShipmentSuggestedActionsPanelProps {
  audience: ShipmentActionAudience;
  shipmentId?: string;
  suggestionContext?: Omit<SuggestShipmentActionsInput, "audience">;
  onAction?: (action: SuggestedShipmentAction) => void;
  variant?: SuggestedShipmentActionsProps["variant"];
}
