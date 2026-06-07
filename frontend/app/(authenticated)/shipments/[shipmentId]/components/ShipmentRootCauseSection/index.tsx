"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/contexts/toast";
import { updateShipmentRootCause } from "@/services/shipment.service";
import type { ShipmentRootCause } from "@shared/dto/performance.dto";
import { ShipmentRootCauseEditor } from "@/components/ShipmentRootCauseEditor";

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
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(initialRootCause);

  const handleChange = useCallback(
    async (next: ShipmentRootCause | null) => {
      setValue(next);
      setSaving(true);
      try {
        await updateShipmentRootCause({
          shipmentId,
          organizationId,
          rootCause: next,
        });
        onSaved?.();
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not save root cause", "error");
        setValue(initialRootCause);
      } finally {
        setSaving(false);
      }
    },
    [initialRootCause, onSaved, organizationId, shipmentId, toast],
  );

  return (
    <ShipmentRootCauseEditor
      value={value}
      saving={saving}
      variant={variant}
      onChange={(v) => void handleChange(v)}
    />
  );
}
