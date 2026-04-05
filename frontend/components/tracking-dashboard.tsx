"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TrackingRequest, Alert, Container, ReportMessage } from "@/types/database";
import { DashboardPersonalOverview } from "@/components/dashboard-personal-overview";
import { DashboardTriage, isRequestInMyScope } from "@/components/dashboard-triage";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { TRACKING_CREATED_EVENT } from "@/lib/tracking-created-event";

export function TrackingDashboard() {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const [requests, setRequests] = useState<TrackingRequest[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [triageContainersById, setTriageContainersById] = useState<
    Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">>
  >({});
  const [triageAttachmentCounts, setTriageAttachmentCounts] = useState<Record<string, number>>({});
  const [triageMessages, setTriageMessages] = useState<ReportMessage[]>([]);
  const [participatingShipmentIds, setParticipatingShipmentIds] = useState<string[]>([]);
  const [shipmentOwnerByShipmentId, setShipmentOwnerByShipmentId] = useState<Record<string, string | null>>({});
  const [shipmentAssigneeByShipmentId, setShipmentAssigneeByShipmentId] = useState<
    Record<string, string | null>
  >({});
  const [triageLoading, setTriageLoading] = useState(false);

  const loadLists = useCallback(async () => {
    if (!selectedOrgId) return;
    setTriageLoading(true);
    const supabase = createClient();
    try {
    const { data: authData } = await supabase.auth.getUser();
    const uid = authData.user?.id ?? null;
    setCurrentUserId(uid);

    const [{ data: tr }, { data: al }] = await Promise.all([
      supabase
        .from("tracking_requests")
        .select("*")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("alerts")
        .select("*")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    const list = (tr as TrackingRequest[]) ?? [];
    setRequests(list);
    setAlerts((al as Alert[]) ?? []);

    if (list.length === 0) {
      setTriageContainersById({});
      setShipmentOwnerByShipmentId({});
      setShipmentAssigneeByShipmentId({});
      setTriageAttachmentCounts({});
      setTriageMessages([]);
      setParticipatingShipmentIds([]);
      return;
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
    setParticipatingShipmentIds([...new Set(participatingShipments)]);

    const containerIds = [
      ...new Set(list.map((r) => r.container_id).filter((id): id is string => Boolean(id))),
    ];

    let map: Record<string, Pick<Container, "id" | "status" | "location" | "shipment_id">> = {};
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
    setTriageContainersById(map);

    const shipmentIds = [...new Set(Object.values(map).map((c) => c.shipment_id).filter(Boolean))];
    let owners: Record<string, string | null> = {};
    let assignees: Record<string, string | null> = {};
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
    setShipmentOwnerByShipmentId(owners);
    setShipmentAssigneeByShipmentId(assignees);

    const participatingSet = new Set(participatingShipments);
    const myScopeIds = list
      .filter((r) =>
        isRequestInMyScope(r, uid, participatingSet, map, owners, assignees),
      )
      .map((r) => r.id);

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
      setTriageAttachmentCounts(counts);

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
      setTriageMessages(merged as ReportMessage[]);
    } else {
      setTriageAttachmentCounts({});
      setTriageMessages([]);
    }
    } finally {
      setTriageLoading(false);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    startTransition(() => {
      void loadLists();
    });
  }, [loadLists]);

  useEffect(() => {
    const onCreated = () => {
      startTransition(() => {
        void loadLists();
      });
    };
    window.addEventListener(TRACKING_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(TRACKING_CREATED_EVENT, onCreated);
  }, [loadLists]);

  const selectedOrgName = useMemo(() => {
    const row = orgs.find((r) => r.organizations?.id === selectedOrgId);
    return row?.organizations?.name ?? null;
  }, [orgs, selectedOrgId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400">
          Your workload and triage for shipments you own, lines assigned to you, or lines you collaborate on. Start
          tracking from{" "}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">Track</span> in the header; browse every
          shipment under <Link href="/shipments" className="font-medium text-zinc-800 underline dark:text-zinc-200">Shipments</Link>.
          {process.env.NODE_ENV === "development" ? (
            <>
              {" "}
              In local dev, <span className="font-medium text-zinc-800 dark:text-zinc-200">Simulate</span> drives mock
              milestones from the header.
            </>
          ) : null}
        </p>
      </header>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You are not a member of any organization yet.
          </p>
          {isSuperAdmin ? (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              As platform superadmin you still pick an org for context, or create one under{" "}
              <Link href="/admin/organizations" className="font-medium text-zinc-900 underline dark:text-zinc-100">
                Platform → Organizations
              </Link>
              .
            </p>
          ) : null}
        </div>
      ) : (
        <>
          {selectedOrgId ? (
            <>
              <DashboardPersonalOverview
                userId={currentUserId}
                orgName={selectedOrgName}
                requests={requests}
                alerts={alerts}
                containersById={triageContainersById}
                shipmentOwnerByShipmentId={shipmentOwnerByShipmentId}
                shipmentAssigneeByShipmentId={shipmentAssigneeByShipmentId}
                participatingShipmentIds={participatingShipmentIds}
              />
              <DashboardTriage
                userId={currentUserId}
                loading={triageLoading}
                requests={requests}
                alerts={alerts}
                containersById={triageContainersById}
                shipmentOwnerByShipmentId={shipmentOwnerByShipmentId}
                shipmentAssigneeByShipmentId={shipmentAssigneeByShipmentId}
                attachmentCountByRequestId={triageAttachmentCounts}
                messages={triageMessages}
                participatingShipmentIds={new Set(participatingShipmentIds)}
              />
            </>
          ) : null}

        </>
      )}
    </div>
  );
}
