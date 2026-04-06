import { createClient } from "@/lib/supabase/client";
import { isRequestInMyScope } from "@/utils/dashboard-scope";
import type { Alert, Container, ReportMessage, TrackingRequest } from "@/types/database";

export type TrackingDashboardSnapshot = {
  currentUserId: string | null;
  requests: TrackingRequest[];
  alerts: Alert[];
  triageContainersById: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">>;
  triageAttachmentCounts: Record<string, number>;
  triageMessages: ReportMessage[];
  participatingShipmentIds: string[];
  shipmentOwnerByShipmentId: Record<string, string | null>;
  shipmentAssigneeByShipmentId: Record<string, string | null>;
};

export async function fetchTrackingDashboardSnapshot(
  organizationId: string,
): Promise<TrackingDashboardSnapshot> {
  const supabase = createClient();
  const { data: authData } = await supabase.auth.getUser();
  const uid = authData.user?.id ?? null;

  const [{ data: tr }, { data: al }] = await Promise.all([
    supabase
      .from("tracking_requests")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("alerts")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const list = (tr as TrackingRequest[]) ?? [];
  const alerts = (al as Alert[]) ?? [];

  if (list.length === 0) {
    return {
      currentUserId: uid,
      requests: list,
      alerts,
      triageContainersById: {},
      triageAttachmentCounts: {},
      triageMessages: [],
      participatingShipmentIds: [],
      shipmentOwnerByShipmentId: {},
      shipmentAssigneeByShipmentId: {},
    };
  }

  const participatingShipments: string[] = [];
  if (uid) {
    const { data: partRows } = await supabase
      .from("shipment_participants")
      .select("shipment_id")
      .eq("user_id", uid);
    for (const row of partRows ?? []) {
      participatingShipments.push(row.shipment_id as string);
    }
  }
  const participatingShipmentIds = [...new Set(participatingShipments)];

  const containerIds = [
    ...new Set(list.map((r) => r.container_id).filter((id): id is string => Boolean(id))),
  ];

  const map: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">> = {};
  if (containerIds.length > 0) {
    const { data: contRows } = await supabase
      .from("containers")
      .select("id, status, location, shipment_id")
      .in("id", containerIds);
    for (const row of (contRows ?? []) as Pick<
      Container,
      "id" | "status" | "location" | "shipment_id"
    >[]) {
      map[row.id] = row;
    }
  }

  const shipmentIds = [...new Set(Object.values(map).map((c) => c.shipment_id).filter(Boolean))];
  const owners: Record<string, string | null> = {};
  const assignees: Record<string, string | null> = {};
  if (shipmentIds.length > 0) {
    const { data: shipRows } = await supabase
      .from("shipments")
      .select("id, created_by, assignee_user_id")
      .in("id", shipmentIds);
    for (const row of shipRows ?? []) {
      owners[row.id as string] = (row.created_by as string | null) ?? null;
      assignees[row.id as string] = (row.assignee_user_id as string | null) ?? null;
    }
  }

  const participatingSet = new Set(participatingShipments);
  const myScopeIds = list
    .filter((r) => isRequestInMyScope(r, uid, participatingSet, map, owners, assignees))
    .map((r) => r.id);

  let triageAttachmentCounts: Record<string, number> = {};
  let triageMessages: ReportMessage[] = [];

  if (myScopeIds.length > 0) {
    const containerIdByRequest = new Map<string, string>();
    for (const r of list) {
      if (r.container_id) containerIdByRequest.set(r.id, r.container_id);
    }
    const myScopeContainerIds = [
      ...new Set(
        myScopeIds.map((rid) => containerIdByRequest.get(rid)).filter((id): id is string => Boolean(id)),
      ),
    ];

    const { data: attRows } = await supabase
      .from("workspace_attachments")
      .select("container_id")
      .in("container_id", myScopeContainerIds);
    const requestByContainer = new Map<string, string>();
    for (const r of list) {
      if (r.container_id) requestByContainer.set(r.container_id, r.id);
    }
    const counts: Record<string, number> = {};
    for (const row of attRows ?? []) {
      const cid = row.container_id as string;
      const rid = requestByContainer.get(cid);
      if (!rid) continue;
      counts[rid] = (counts[rid] ?? 0) + 1;
    }
    triageAttachmentCounts = counts;

    const shipmentIdsForScope = [
      ...new Set(
        myScopeContainerIds
          .map((cid) => map[cid]?.shipment_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const [{ data: msgRows }, { data: msgShipmentRows }] = await Promise.all([
      supabase
        .from("report_messages")
        .select("*")
        .in("container_id", myScopeContainerIds)
        .order("created_at", { ascending: true })
        .limit(2000),
      shipmentIdsForScope.length > 0
        ? supabase
            .from("report_messages")
            .select("*")
            .in("shipment_id", shipmentIdsForScope)
            .is("container_id", null)
            .order("created_at", { ascending: true })
            .limit(500)
        : Promise.resolve({ data: [] as ReportMessage[] }),
    ]);

    const merged = [...(msgRows ?? []), ...(msgShipmentRows ?? [])].sort(
      (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
    );
    triageMessages = merged as ReportMessage[];
  }

  return {
    currentUserId: uid,
    requests: list,
    alerts,
    triageContainersById: map,
    triageAttachmentCounts,
    triageMessages,
    participatingShipmentIds,
    shipmentOwnerByShipmentId: owners,
    shipmentAssigneeByShipmentId: assignees,
  };
}
