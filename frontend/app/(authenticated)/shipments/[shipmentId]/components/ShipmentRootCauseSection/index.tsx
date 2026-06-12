"use client";

import { ShipmentRootCauseEditor } from "@/components/ShipmentRootCauseEditor";
import type { ShipmentRootCause } from "@shared/dto/performance.dto";
import { useShipmentRootCauseSection } from "./useShipmentRootCauseSection";

export function ShipmentRootCauseSection({
  shipmentId,
  organizationId,
  initialRootCause,
  onSaved,
  variant = "default",
}: {
  shipmentId: string;
  organizationId: string;
  initialRootCause: ShipmentRootCause | null;
  onSaved?: () => void;
  variant?: "default" | "inline";
}) {
  const { value, saving, handleChange } = useShipmentRootCauseSection({
    shipmentId,
    organizationId,
    initialRootCause,
    onSaved,
  });

  return (
    <ShipmentRootCauseEditor
      value={value}
      saving={saving}
      variant={variant}
      onChange={(v) => void handleChange(v)}
    />
  );
}
