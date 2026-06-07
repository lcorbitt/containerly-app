"use client";

import { ShipmentCommercialDetailsGrid } from "./ShipmentCommercialDetailsGrid";
import { ShipmentCommercialSummaryBar } from "./ShipmentCommercialSummaryBar";
import type { ShipmentCommercialHeaderProps } from "./types";

export function ShipmentCommercialHeader({ source }: ShipmentCommercialHeaderProps) {
  return (
    <>
      <ShipmentCommercialSummaryBar source={source} />
      <ShipmentCommercialDetailsGrid source={source} />
    </>
  );
}

export type { ShipmentCommercialHeaderProps, ShipmentCommercialHeaderSource } from "./types";
