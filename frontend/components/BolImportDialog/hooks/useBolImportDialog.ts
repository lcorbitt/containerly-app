"use client";

import { useId, useState } from "react";
import { notifyBolImported } from "@/services/notification.service";
import { createTrackingRequest } from "@/services/tracking.service";
import { lookupBolContainers } from "@/services/shipment.service";
import { useToast } from "@/atoms/toast";

interface UseBolImportDialogParams {
  organizationId: string;
  onClose: () => void;
  onImported: () => void;
}

export function useBolImportDialog({
  organizationId,
  onClose,
  onImported,
}: UseBolImportDialogParams) {
  const { toast } = useToast();
  const carrierSelectId = useId();

  const [bol, setBol] = useState("");
  const [carrierLookupOverride, setCarrierLookupOverride] = useState("");
  const [carrierPanelOpen, setCarrierPanelOpen] = useState(false);
  const [carrierPanelSnapshot, setCarrierPanelSnapshot] = useState("");
  const [lookupBusy, setLookupBusy] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [numbers, setNumbers] = useState<string[]>([]);
  const [lineName, setLineName] = useState<string | null>(null);
  const [shippingLineParam, setShippingLineParam] = useState<string | null>(
    null,
  );
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  function reset() {
    setBol("");
    setCarrierLookupOverride("");
    setCarrierPanelOpen(false);
    setCarrierPanelSnapshot("");
    setNumbers([]);
    setLineName(null);
    setShippingLineParam(null);
    setSelected({});
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function runLookup() {
    const q = bol.trim();
    if (!q) {
      toast("Enter a bill of lading number.", "error");
      return;
    }
    setLookupBusy(true);
    try {
      const r = await lookupBolContainers({
        organizationId,
        billOfLading: q,
        ...(carrierLookupOverride.trim()
          ? { shippingLine: carrierLookupOverride.trim() }
          : {}),
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      setNumbers(r.associated_container_numbers);
      setLineName(r.shipping_line_name);
      setShippingLineParam(r.shipping_line);
      const next: Record<string, boolean> = {};
      for (const n of r.associated_container_numbers) next[n] = true;
      setSelected(next);
      if (r.associated_container_numbers.length === 0) {
        toast("No containers returned for that BOL.", "info");
      }
    } finally {
      setLookupBusy(false);
    }
  }

  async function runImport() {
    const toCreate = numbers.filter((n) => selected[n]);
    if (toCreate.length === 0) {
      toast("Select at least one container.", "info");
      return;
    }
    const bolNorm = bol.trim();
    const shipmentGroupId = crypto.randomUUID();
    setImportBusy(true);
    let ok = 0;
    let shipmentIdForNotify: string | null = null;
    const failures: string[] = [];
    try {
      for (const container_number of toCreate) {
        try {
          const created = await createTrackingRequest({
            organization_id: organizationId,
            container_number,
            run_sync: true,
            shipment_group_id: shipmentGroupId,
            source_bill_of_lading: bolNorm || undefined,
            ...(shippingLineParam?.trim()
              ? { shipping_line: shippingLineParam.trim() }
              : {}),
          });
          if (!shipmentIdForNotify && typeof created.shipment_id === "string") {
            shipmentIdForNotify = created.shipment_id;
          }
          ok += 1;
        } catch (e) {
          failures.push(
            `${container_number}: ${e instanceof Error ? e.message : "failed"}`,
          );
        }
      }
      if (ok > 0) {
        if (shipmentIdForNotify && bolNorm) {
          try {
            await notifyBolImported({
              organizationId,
              shipmentId: shipmentIdForNotify,
              billOfLading: bolNorm,
              containerCount: ok,
            });
          } catch {
            /* best-effort */
          }
        }
        toast(
          ok === 1
            ? "Created 1 tracking request."
            : `Created ${ok} tracking requests.`,
          "success",
        );
        onImported();
      }
      if (failures.length > 0) {
        toast(failures.slice(0, 3).join(" · "), "error");
      }
      if (ok > 0) handleClose();
    } finally {
      setImportBusy(false);
    }
  }

  function openCarrierPanel() {
    setCarrierPanelSnapshot(carrierLookupOverride);
    setCarrierPanelOpen(true);
  }

  function cancelCarrierPanel() {
    setCarrierLookupOverride(carrierPanelSnapshot);
    setCarrierPanelOpen(false);
  }

  function clearCarrierOverride() {
    setCarrierLookupOverride("");
    setCarrierPanelOpen(false);
    setCarrierPanelSnapshot("");
  }

  function handleCarrierSelect(v: string) {
    setCarrierLookupOverride(v);
    if (v) setCarrierPanelOpen(false);
  }

  function toggleContainer(n: string, next: boolean) {
    setSelected((s) => ({ ...s, [n]: next }));
  }

  const inputsDisabled = lookupBusy || importBusy;

  return {
    carrierSelectId,
    bol,
    setBol,
    carrierLookupOverride,
    carrierPanelOpen,
    lookupBusy,
    importBusy,
    numbers,
    lineName,
    shippingLineParam,
    selected,
    inputsDisabled,
    handleClose,
    runLookup,
    runImport,
    openCarrierPanel,
    cancelCarrierPanel,
    clearCarrierOverride,
    handleCarrierSelect,
    toggleContainer,
  };
}
