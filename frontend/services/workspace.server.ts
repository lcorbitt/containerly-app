import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { profileDisplayName } from "@/utils/author-display-name";
import type { ShipmentActivityEvent } from "@shared/dto/shipment.dto";
import type { ReportActivity, ReportMessage, TrackingRequest, WorkspaceAttachment } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";
import type {
  ContainerWorkspaceLoadResult,
  ContainerWorkspaceSnapshot,
  WorkspaceQuickSearchRow,
} from "@/types/workspace-load";

export type { ContainerWorkspaceLoadResult, ContainerWorkspaceSnapshot, WorkspaceQuickSearchRow };

function mapActivityEventRow(row: Record<string, unknown>): ShipmentActivityEvent {
  return {
    id: row.id as string,
    event_type: row.event_type as string,
    body: row.body as string,
    actor_kind: row.actor_kind as string,
    occurred_at: row.occurred_at as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

function activityEventMatchesContainer(
  event: ShipmentActivityEvent,
  containerId: string,
): boolean {
  if (event.event_type !== "customer_message" && event.event_type !== "operator_message") {
    return false;
  }
  const meta = event.metadata ?? {};
  const scopedContainerId = meta.container_id;
  return typeof scopedContainerId === "string" && scopedContainerId === containerId;
}

export async function loadContainerWorkspaceDataForUser(
  supabase: SupabaseClient,
  input: { containerId: string; organizationId: string },
): Promise<ContainerWorkspaceLoadResult> {
  const { data: cRow, error: cErr } = await supabase
    .from("containers")
    .select("id, shipment_id, status, carrier, location, last_synced_at, enrichment")
    .eq("id", input.containerId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (cErr) {
    return { ok: false, error: cErr.message };
  }
  if (!cRow) {
    return { ok: false, error: "Container not found in this organization." };
  }

  const { data: tr, error: trErr } = await supabase
    .from("tracking_requests")
    .select("*")
    .eq("container_id", input.containerId)
    .eq("organization_id", input.organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (trErr) {
    return { ok: false, error: trErr.message };
  }
  if (!tr) {
    return {
      ok: false,
      error: "No carrier sync line for this container yet. Enable carrier tracking from the shipment workspace after documents are approved.",
    };
  }

  const shipmentIdForSiblings = typeof cRow.shipment_id === "string" ? cRow.shipment_id : null;

  const siblingQuery =
    shipmentIdForSiblings && input.organizationId
      ? supabase
          .from("containers")
          .select("id, container_number")
          .eq("shipment_id", shipmentIdForSiblings)
          .eq("organization_id", input.organizationId)
          .neq("id", input.containerId)
          .order("container_number", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; container_number: string }[], error: null });

  const [{ data: msg }, { data: act }, { data: tev }, attRes, siblingResult, activityRes] = await Promise.all([
    supabase
      .from("report_messages")
      .select("*")
      .eq("container_id", input.containerId)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_activity")
      .select("*")
      .eq("container_id", input.containerId)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("tracking_events")
      .select(
        "id, event_type, status, location, occurred_at, created_at, container_id, tracking_request_id, raw_payload",
      )
      .eq("container_id", input.containerId)
      .order("occurred_at", { ascending: true })
      .limit(100),
    supabase
      .from("workspace_attachments")
      .select("*")
      .eq("container_id", input.containerId)
      .order("created_at", { ascending: false }),
    siblingQuery,
    shipmentIdForSiblings
      ? supabase
          .from("shipment_activity_events")
          .select("id, event_type, body, actor_kind, occurred_at, metadata")
          .eq("shipment_id", shipmentIdForSiblings)
          .in("event_type", ["customer_message", "operator_message"])
          .order("occurred_at", { ascending: true })
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
  ]);

  const msgList = (msg as ReportMessage[]) ?? [];
  const attRows: WorkspaceAttachment[] = attRes.error
    ? []
    : ((attRes.data as WorkspaceAttachment[]) ?? []);

  const authorIds = [
    ...new Set(msgList.map((m) => m.author_user_id).filter((id): id is string => Boolean(id))),
  ];
  const uploaderIds = [...new Set(attRows.map((a) => a.uploaded_by))];
  const profileIds = [...new Set([...authorIds, ...uploaderIds])];

  const nameByUser: Record<string, string> = {};
  const profileImagePathByUserId: Record<string, string | null> = {};
  if (profileIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email, full_name, profile_image_path")
      .in("id", profileIds);
    for (const p of profs ?? []) {
      const id = p.id as string;
      nameByUser[id] = profileDisplayName({
        full_name: p.full_name as string | null,
        email: p.email as string | null,
      });
      profileImagePathByUserId[id] =
        ((p.profile_image_path as string | null | undefined)?.trim() || null);
    }
  }

  const sib = siblingResult as {
    data: { id: string; container_number: string }[] | null;
    error: { message: string } | null;
  };
  const srows = sib.data;
  const bolGroupSiblings =
    !sib.error && Array.isArray(srows)
      ? srows.map((r) => ({
          id: r.id,
          container_number: r.container_number,
        }))
      : [];

  const containerRow: ContainerWorkspaceSnapshot = {
    shipment_id: typeof cRow.shipment_id === "string" ? cRow.shipment_id : null,
    status: (cRow.status as string | null) ?? null,
    carrier: (cRow.carrier as string | null) ?? null,
    location: (cRow.location as Record<string, unknown> | null) ?? null,
    last_synced_at: (cRow.last_synced_at as string | null) ?? null,
    enrichment:
      cRow.enrichment && typeof cRow.enrichment === "object"
        ? (cRow.enrichment as Record<string, unknown>)
        : null,
  };

  const activityEvents = ((activityRes.data as Record<string, unknown>[] | null) ?? [])
    .map(mapActivityEventRow)
    .filter((event) => activityEventMatchesContainer(event, input.containerId));

  return {
    ok: true,
    request: tr as TrackingRequest,
    messages: msgList,
    messageAuthorByUserId: nameByUser,
    profileImagePathByUserId,
    activity: (act as ReportActivity[]) ?? [],
    activityEvents,
    timeline: [...((tev as PublicTimelineEvent[] | null) ?? [])],
    containerRow,
    bolGroupSiblings,
    attachments: attRows,
    quietAttachmentWarning: attRes.error?.message,
  };
}

export async function fetchWorkspaceQuickSearchForOrg(
  supabase: SupabaseClient,
  args: { organizationId: string; query: string; limit?: number },
): Promise<WorkspaceQuickSearchRow[]> {
  const q = args.query.trim();
  if (q.length < 2) return [];

  const { data, error } = await supabase.rpc("workspace_quick_search", {
    p_organization_id: args.organizationId,
    p_query: q,
    p_limit: args.limit ?? 8,
  });

  if (error) throw new Error(error.message);

  const rows = (data as WorkspaceQuickSearchRow[] | null) ?? [];
  return rows.map((r) => ({
    kind: r.kind,
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    path: r.path.startsWith("/") ? r.path : `/${r.path}`,
  }));
}
