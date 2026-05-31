"use client";

import { memo, useCallback } from "react";
import { ShipmentSidebarSettingsRow } from "./ShipmentSidebarSettingsRow";
import { ShipmentTagsEditor } from "./ShipmentTagsPanel/ShipmentTagsEditor";
import { ShipmentTagsSummary } from "./ShipmentTagsPanel/ShipmentTagsSummary";
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
    <ShipmentSidebarSettingsRow
      label="Tags"
      summary={<ShipmentTagsSummary tags={tagsState.tags} />}
    >
      <ShipmentTagsEditor state={tagsState} />
    </ShipmentSidebarSettingsRow>
  );
});
