"use client";

import { useCallback, useEffect, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import {
  fetchOrganizationPerformanceSettingsBrowser,
  updateOrganizationPerformanceSettingsBrowser,
} from "@/services/organization-performance.service";
import type { OrgPerformanceSettings } from "@shared/dto/performance.dto";
import {
  parseRequiredDocumentTypesInput,
  requiredDocumentTypesToInput,
} from "@/utils/org-performance-settings";

export function OrganizationPerformanceSettings() {
  const { selectedOrgId } = useOrganizationWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slaHours, setSlaHours] = useState("24");
  const [staleHours, setStaleHours] = useState("48");
  const [requiredDocs, setRequiredDocs] = useState("");

  useEffect(() => {
    if (!selectedOrgId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const settings = await fetchOrganizationPerformanceSettingsBrowser(selectedOrgId);
        if (cancelled) return;
        setSlaHours(String(settings.sla_response_hours));
        setStaleHours(String(settings.stale_update_reminder_hours));
        setRequiredDocs(requiredDocumentTypesToInput(settings.required_document_types));
      } catch (e) {
        if (!cancelled) {
          toast(e instanceof Error ? e.message : "Could not load performance settings", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedOrgId, toast]);

  const save = useCallback(async () => {
    if (!selectedOrgId) return;
    setSaving(true);
    try {
      const settings: OrgPerformanceSettings = {
        sla_response_hours: Math.max(1, Number(slaHours) || 24),
        stale_update_reminder_hours: Math.max(1, Number(staleHours) || 48),
        required_document_types: parseRequiredDocumentTypesInput(requiredDocs),
      };
      await updateOrganizationPerformanceSettingsBrowser({
        organizationId: selectedOrgId,
        settings,
      });
      toast("Performance guardrails saved", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save settings", "error");
    } finally {
      setSaving(false);
    }
  }, [requiredDocs, selectedOrgId, slaHours, staleHours, toast]);

  if (!selectedOrgId) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Performance guardrails</h3>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        SLA expectations, stale-update reminders, and required document types before approval.
      </p>
      {loading ? (
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      ) : (
        <div className="mt-4 flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">SLA response (hours)</span>
            <input
              type="number"
              min={1}
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Stale update reminder (hours)</span>
            <input
              type="number"
              min={1}
              value={staleHours}
              onChange={(e) => setStaleHours(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Required document types (comma-separated)</span>
            <input
              value={requiredDocs}
              onChange={(e) => setRequiredDocs(e.target.value)}
              placeholder="commercial_invoice, packing_list"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="w-fit rounded-lg border border-zinc-200 bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Saving…" : "Save guardrails"}
          </button>
        </div>
      )}
    </div>
  );
}
