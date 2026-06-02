import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShipmentWorkflowStatus } from "@shared/dto/logistics.dto";
import { parseOrgPerformanceSettings, missingRequiredDocumentTypes } from "@/utils/org-performance-settings";

/**
 * Mirrors `recomputeWorkflowStatus` in
 * `supabase/functions/_lib/document-workflow.service.ts` (source of truth).
 */
export async function recomputeShipmentWorkflowStatus(
  supabase: SupabaseClient,
  shipmentId: string,
): Promise<ShipmentWorkflowStatus> {
  const { data: containers, error: containerErr } = await supabase
    .from("containers")
    .select("id")
    .eq("shipment_id", shipmentId);
  if (containerErr) throw new Error(containerErr.message);

  const containerIds = (containers ?? []).map((c) => c.id as string);

  const shipmentAtt = await supabase
    .from("workspace_attachments")
    .select("id, approval_status, document_group, is_internal, document_type")
    .eq("shipment_id", shipmentId)
    .eq("is_internal", false)
    .not("document_group", "is", null);

  if (shipmentAtt.error) throw new Error(shipmentAtt.error.message);

  let containerAtt: { data: Record<string, unknown>[] | null; error: { message: string } | null } = {
    data: [],
    error: null,
  };
  if (containerIds.length > 0) {
    containerAtt = await supabase
      .from("workspace_attachments")
      .select("id, approval_status, document_group, is_internal, document_type")
      .in("container_id", containerIds)
      .eq("is_internal", false)
      .not("document_group", "is", null);
    if (containerAtt.error) throw new Error(containerAtt.error.message);
  }

  const docs = [...(shipmentAtt.data ?? []), ...(containerAtt.data ?? [])];
  const reviewable = docs.filter(
    (d) => d.document_group === "draft" || d.document_group === "revision",
  );

  if (reviewable.length === 0) return "pending_drafts";

  const anyRejected = reviewable.some((d) => d.approval_status === "rejected");
  if (anyRejected) return "rejected";

  const allApproved = reviewable.every((d) => d.approval_status === "approved");
  if (allApproved) {
    const { data: shipmentRow } = await supabase
      .from("shipments")
      .select("organization_id")
      .eq("id", shipmentId)
      .maybeSingle();
    const orgId = shipmentRow?.organization_id as string | undefined;
    if (orgId) {
      const { data: orgRow } = await supabase
        .from("organizations")
        .select("performance_settings")
        .eq("id", orgId)
        .maybeSingle();
      const settings = parseOrgPerformanceSettings(orgRow?.performance_settings);
      const uploadedTypes = docs
        .map((d) => (typeof d.document_type === "string" ? d.document_type : ""))
        .filter(Boolean);
      const missing = missingRequiredDocumentTypes(settings.required_document_types, uploadedTypes);
      if (missing.length > 0) return "awaiting_review";
    }
    return "approved";
  }

  return "awaiting_review";
}

export async function persistShipmentWorkflowStatus(
  supabase: SupabaseClient,
  shipmentId: string,
): Promise<ShipmentWorkflowStatus> {
  const workflowStatus = await recomputeShipmentWorkflowStatus(supabase, shipmentId);
  const { error } = await supabase
    .from("shipments")
    .update({ workflow_status: workflowStatus })
    .eq("id", shipmentId);
  if (error) throw new Error(error.message);
  return workflowStatus;
}
