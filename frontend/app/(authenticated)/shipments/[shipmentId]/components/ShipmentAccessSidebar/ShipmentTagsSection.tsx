"use client";

import { memo, useCallback } from "react";
import { ShipmentTagsPanel } from "./ShipmentTagsPanel";
import { useShipmentTagsPanel } from "./ShipmentTagsPanel/useShipmentTagsPanel";

export const ShipmentTagsSection = memo(function ShipmentTagsSection({
  shipmentId,
  initialTags,
  orgTagSuggestions,
  onTagsSaved,
}: {
  shipmentId: string;
  initialTags: string[];
  orgTagSuggestions: string[];
  onTagsSaved: (savedTags: string[]) => void;
}) {
  const onTagsChanged = useCallback(
    (savedTags: string[]) => {
      onTagsSaved(savedTags);
    },
    [onTagsSaved],
  );

  const tagsState = useShipmentTagsPanel({
    shipmentId,
    initialTags,
    orgTagSuggestions,
    onTagsChanged,
  });

  return (
    <section className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <ShipmentTagsPanel state={tagsState} />
    </section>
  );
});
