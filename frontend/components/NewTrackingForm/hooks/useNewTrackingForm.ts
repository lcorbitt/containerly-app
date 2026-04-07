"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createTrackingRequest } from "@/services/tracking.service";
import { fetchOrganizationShipmentsForTrackingPick } from "@/services/shipment.service";
import type { CustomSelectOption } from "@/components/CustomSelect";

interface UseNewTrackingFormParams {
  organizationId: string;
  onCreated: () => void;
}

export function useNewTrackingForm({
  organizationId,
  onCreated,
}: UseNewTrackingFormParams) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingLine, setShippingLine] = useState("");
  const [shipmentMode, setShipmentMode] = useState<"new" | "existing">("new");
  const [shipmentReference, setShipmentReference] = useState("");
  const [existingShipmentId, setExistingShipmentId] = useState("");
  const [shipments, setShipments] = useState<
    { id: string; reference: string; created_at: string }[]
  >([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsError, setShipmentsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shipmentSelectOptions = useMemo((): CustomSelectOption[] => {
    return shipments.map((s) => ({
      value: s.id,
      label: `${s.reference} · ${new Date(s.created_at).toLocaleDateString()}`,
    }));
  }, [shipments]);

  const loadShipments = useCallback(async () => {
    setShipmentsLoading(true);
    setShipmentsError(null);
    try {
      const rows =
        await fetchOrganizationShipmentsForTrackingPick(organizationId);
      setShipments(rows);
      setExistingShipmentId((prev) => {
        if (prev && rows.some((r) => r.id === prev)) return prev;
        return rows[0]?.id ?? "";
      });
    } catch (e) {
      setShipments([]);
      setShipmentsError(
        e instanceof Error ? e.message : "Could not load shipments",
      );
    } finally {
      setShipmentsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (shipmentMode !== "existing") return;
    void loadShipments();
  }, [shipmentMode, loadShipments]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = trackingNumber.trim();
    if (!trimmed) {
      setError("Enter a tracking number.");
      return;
    }
    if (shipmentMode === "existing" && !existingShipmentId) {
      setError("Choose a shipment, or switch to \u201cNew shipment\u201d.");
      return;
    }

    setLoading(true);
    try {
      await createTrackingRequest({
        organization_id: organizationId,
        container_number: trimmed,
        run_sync: true,
        ...(shippingLine.trim()
          ? { shipping_line: shippingLine.trim() }
          : {}),
        ...(shipmentMode === "existing"
          ? { shipment_id: existingShipmentId }
          : shipmentReference.trim()
            ? { shipment_reference: shipmentReference.trim() }
            : {}),
      });

      setTrackingNumber("");
      setShippingLine("");
      setShipmentReference("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const submitDisabled =
    loading ||
    (shipmentMode === "existing" &&
      (shipmentsLoading || shipments.length === 0));

  return {
    trackingNumber,
    setTrackingNumber,
    shippingLine,
    setShippingLine,
    shipmentMode,
    setShipmentMode,
    shipmentReference,
    setShipmentReference,
    existingShipmentId,
    setExistingShipmentId,
    shipmentSelectOptions,
    shipmentsLoading,
    shipmentsError,
    shipments,
    error,
    loading,
    submitDisabled,
    submit,
  };
}
