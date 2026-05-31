"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createTrackingRequest } from "@/services/tracking.service";
import { fetchOrganizationShipmentsForTrackingPick } from "@/services/shipment.service";
import type { CustomSelectOption } from "@/components/CustomSelect";

interface UseNewTrackingFormParams {
  organizationId: string;
  onCreated: () => void;
  /** When set, attach sync to this shipment and hide shipment picker. */
  fixedShipmentId?: string;
}

export function useNewTrackingForm({
  organizationId,
  onCreated,
  fixedShipmentId,
}: UseNewTrackingFormParams) {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingLine, setShippingLine] = useState("");
  const [shipmentMode, setShipmentMode] = useState<"new" | "existing">(
    fixedShipmentId ? "existing" : "existing",
  );
  const [orderNumber, setOrderNumber] = useState("");
  const [existingShipmentId, setExistingShipmentId] = useState(fixedShipmentId ?? "");
  const [shipments, setShipments] = useState<
    { id: string; order_number: string; created_at: string }[]
  >([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsError, setShipmentsError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fixedShipmentId) {
      setExistingShipmentId(fixedShipmentId);
      setShipmentMode("existing");
    }
  }, [fixedShipmentId]);

  const shipmentSelectOptions = useMemo((): CustomSelectOption[] => {
    return shipments.map((s) => ({
      value: s.id,
      label: `${s.order_number} · ${new Date(s.created_at).toLocaleDateString()}`,
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
        if (fixedShipmentId) return fixedShipmentId;
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
  }, [organizationId, fixedShipmentId]);

  useEffect(() => {
    if (fixedShipmentId) return;
    if (shipmentMode !== "existing") return;
    void loadShipments();
  }, [shipmentMode, loadShipments, fixedShipmentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = trackingNumber.trim();
    if (!trimmed) {
      setError("Enter a container number.");
      return;
    }
    const shipmentId = fixedShipmentId ?? existingShipmentId;
    if (shipmentMode === "existing" && !shipmentId) {
      setError("Choose a shipment first.");
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
          ? { shipment_id: shipmentId }
          : orderNumber.trim()
            ? { shipment_order_number: orderNumber.trim() }
            : {}),
      });

      setTrackingNumber("");
      setShippingLine("");
      setOrderNumber("");
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  const submitDisabled =
    loading ||
    (!fixedShipmentId &&
      shipmentMode === "existing" &&
      (shipmentsLoading || shipments.length === 0));

  return {
    trackingNumber,
    setTrackingNumber,
    shippingLine,
    setShippingLine,
    shipmentMode,
    setShipmentMode,
    orderNumber,
    setOrderNumber,
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
    fixedShipmentId,
  };
}
