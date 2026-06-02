"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { trackingDashboardQueryKeyRoot, useTrackingDashboardQuery } from "@/hooks/queries/useTracking";
import { canManageOrganizationSettings } from "@/utils/org-role";
import { isRequestInMyScope } from "@/utils/dashboard-scope";
import { computePersonalMetrics } from "@/utils/dashboard-metrics";
import { TRACKING_CREATED_EVENT } from "@/utils/tracking-created-event";
import { buildTriageBucketsFromProps } from "../DashboardTriage";
import type { UseTrackingDashboardResult } from "./types";

export function useTrackingDashboard(): UseTrackingDashboardResult {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const qc = useQueryClient();
  const dashboardQuery = useTrackingDashboardQuery(selectedOrgId);

  useEffect(() => {
    const onCreated = () => {
      void qc.invalidateQueries({ queryKey: trackingDashboardQueryKeyRoot });
    };
    window.addEventListener(TRACKING_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(TRACKING_CREATED_EVENT, onCreated);
  }, [qc]);

  const selectedOrgName =
    orgs.find((r) => r.organizations?.id === selectedOrgId)?.organizations?.name ?? null;
  const selectedMembershipRole = orgs.find((o) => o.organizations?.id === selectedOrgId)?.role;
  const isAdminView = canManageOrganizationSettings(isSuperAdmin, selectedMembershipRole);

  const snap = dashboardQuery.data;
  const userId = snap?.currentUserId ?? null;

  const participatingShipments = useMemo(
    () => new Set(snap?.participatingShipmentIds ?? []),
    [snap?.participatingShipmentIds],
  );

  const mine = useMemo(() => {
    if (!userId || !snap) return [];
    return snap.requests.filter((r) =>
      isRequestInMyScope(
        r,
        userId,
        participatingShipments,
        snap.triageContainersById,
        snap.shipmentOwnerByShipmentId,
        snap.shipmentAssigneeByShipmentId,
      ),
    );
  }, [snap, userId, participatingShipments]);

  const mineIds = useMemo(() => new Set(mine.map((r) => r.id)), [mine]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const triageBuckets = useMemo(() => {
    if (!snap || !userId) return [];
    return buildTriageBucketsFromProps({
      userId,
      requests: snap.requests,
      alerts: snap.alerts,
      containersById: snap.triageContainersById,
      shipmentOwnerByShipmentId: snap.shipmentOwnerByShipmentId,
      shipmentAssigneeByShipmentId: snap.shipmentAssigneeByShipmentId,
      attachmentCountByRequestId: snap.triageAttachmentCounts,
      messages: snap.triageMessages,
      participatingShipmentIds: participatingShipments,
    });
  }, [snap, userId, participatingShipments]);

  const personalMetrics = useMemo(() => {
    if (!userId || !snap) return null;
    return computePersonalMetrics({
      mine,
      mineIds,
      alerts: snap.alerts,
      containersById: snap.triageContainersById,
      shipmentOwnerByShipmentId: snap.shipmentOwnerByShipmentId,
      shipmentAssigneeByShipmentId: snap.shipmentAssigneeByShipmentId,
      participatingShipments,
      userId,
      now,
      triageBuckets,
    });
  }, [mine, mineIds, snap, userId, participatingShipments, now, triageBuckets]);

  return {
    selectedOrgName,
    isAdminView,
    loading: dashboardQuery.isLoading && Boolean(selectedOrgId),
    isError: dashboardQuery.isError,
    snapshot: snap,
    personalMetrics,
    triageBuckets,
  };
}
