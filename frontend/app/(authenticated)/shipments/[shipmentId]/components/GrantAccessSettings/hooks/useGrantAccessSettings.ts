"use client";

import { useCallback, useState } from "react";
import { previewImporterPortalShipment, updateShipmentCustomerAccessSettings } from "@/services/shipment.service";
import { useToast } from "@/atoms/toast";
import type { ShipmentCustomerAccess } from "@/types/database";
import type { PublicReportPayload } from "@/types/public-report";

const DEFAULT_VIS = {
  include_raw_external: false,
  include_alerts: true,
  show_bill_of_lading: false,
  show_ais_enrichment: true,
  show_carrier_timeline: true,
};

function mergeVis(raw: Record<string, unknown> | undefined): Record<string, boolean> {
  return {
    include_raw_external: Boolean(raw?.include_raw_external),
    include_alerts: raw?.include_alerts !== false,
    show_bill_of_lading: raw?.show_bill_of_lading === true,
    show_ais_enrichment: raw?.show_ais_enrichment !== false,
    show_carrier_timeline: raw?.show_carrier_timeline !== false,
  };
}

export function useGrantAccessSettings({
  access,
  onSaved,
}: {
  access: ShipmentCustomerAccess;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [vis, setVis] = useState(() => mergeVis(access.visibility_settings ?? undefined));
  const [ov, setOv] = useState<Record<string, string>>(() => {
    const o = (access.operator_overrides ?? undefined) as Record<string, unknown> | undefined;
    return {
      customer_note: typeof o?.customer_note === "string" ? o.customer_note : "",
      display_eta: typeof o?.display_eta === "string" ? o.display_eta : "",
      display_status_label: typeof o?.display_status_label === "string" ? o.display_status_label : "",
      display_last_location: typeof o?.display_last_location === "string" ? o.display_last_location : "",
    };
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<PublicReportPayload | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const visibilityPayload = useCallback(
    () => ({
      ...DEFAULT_VIS,
      ...vis,
    }),
    [vis],
  );

  const overridesPayload = useCallback(() => {
    const o: Record<string, string> = {};
    if (ov.customer_note.trim()) o.customer_note = ov.customer_note.trim();
    if (ov.display_eta.trim()) o.display_eta = ov.display_eta.trim();
    if (ov.display_status_label.trim()) o.display_status_label = ov.display_status_label.trim();
    if (ov.display_last_location.trim()) o.display_last_location = ov.display_last_location.trim();
    return o;
  }, [ov]);

  async function save() {
    setSaving(true);
    try {
      await updateShipmentCustomerAccessSettings({
        accessId: access.id,
        visibilitySettings: visibilityPayload(),
        operatorOverrides: overridesPayload(),
      });
      toast("Customer portal settings saved", "success");
      onSaved();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function openPreview() {
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const r = await previewImporterPortalShipment({
        shipmentId: access.shipment_id,
        visibilitySettings: visibilityPayload(),
        operatorOverrides: overridesPayload(),
      });
      if (!r.ok) {
        setPreviewPayload(null);
        toast(r.error, "error");
        return;
      }
      setPreviewPayload(r.data);
    } finally {
      setPreviewLoading(false);
    }
  }

  function closePreview() {
    setPreviewOpen(false);
    setPreviewPayload(null);
  }

  return {
    saving,
    vis,
    setVis,
    ov,
    setOv,
    previewOpen,
    previewPayload,
    previewLoading,
    save,
    openPreview,
    closePreview,
  } as const;
}
