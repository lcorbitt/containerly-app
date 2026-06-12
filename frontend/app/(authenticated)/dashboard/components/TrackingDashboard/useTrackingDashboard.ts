"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import {
  trackingDashboardInsightsQueryKeyRoot,
  trackingDashboardQueryKeyRoot,
  trackingDashboardReportsQueryKeyRoot,
  useTrackingDashboardInsightsQuery,
  useTrackingDashboardQuery,
  useTrackingDashboardReportsQuery,
  workspaceSummaryQueryKeyRoot,
} from "@/hooks/queries/useTracking";
import { canManageOrganizationSettings } from "@/utils/org-role";
import { isRequestInMyScope } from "@/utils/dashboard-scope";
import { computePersonalMetrics } from "@/utils/dashboard-metrics";
import { TRACKING_CREATED_EVENT } from "@/utils/tracking-created-event";
import { buildTriageBucketsFromProps } from "../DashboardTriage";
import type { UseTrackingDashboardResult } from "./types";

export function useTrackingDashboard(mode: "triage" | "reports" = "triage"): UseTrackingDashboardResult {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const qc = useQueryClient();
  const dashboardQuery = useTrackingDashboardQuery(selectedOrgId);

  const selectedMembershipRole = orgs.find((o) => o.organizations?.id === selectedOrgId)?.role;
  const isAdminView = canManageOrganizationSettings(isSuperAdmin, selectedMembershipRole);
  const canLoadOrgInsights = isSuperAdmin || selectedMembershipRole != null;

  const insightsQuery = useTrackingDashboardInsightsQuery(
    selectedOrgId,
    mode === "triage" && canLoadOrgInsights,
  );
  const reportsQuery = useTrackingDashboardReportsQuery(
    selectedOrgId,
    mode === "reports" && isAdminView,
  );

  useEffect(() => {
    const onCreated = () => {
      void qc.invalidateQueries({ queryKey: trackingDashboardQueryKeyRoot });
      void qc.invalidateQueries({ queryKey: workspaceSummaryQueryKeyRoot });
      void qc.invalidateQueries({ queryKey: trackingDashboardInsightsQueryKeyRoot });
      void qc.invalidateQueries({ queryKey: trackingDashboardReportsQueryKeyRoot });
    };
    window.addEventListener(TRACKING_CREATED_EVENT, onCreated);
    return () => window.removeEventListener(TRACKING_CREATED_EVENT, onCreated);
  }, [qc]);

  const selectedOrgName =
    orgs.find((r) => r.organizations?.id === selectedOrgId)?.organizations?.name ?? null;

  const snap = useMemo(() => {
    const base = dashboardQuery.data;
    if (!base) return undefined;

    if (mode === "triage" && insightsQuery.data) {
      return { ...base, orgInsights: insightsQuery.data.orgInsights };
    }

    if (mode === "reports" && reportsQuery.data) {
      return {
        ...base,
        orgMetrics: reportsQuery.data.orgMetrics,
        performanceInsights: reportsQuery.data.performanceInsights,
      };
    }

    return base;
  }, [dashboardQuery.data, insightsQuery.data, reportsQuery.data, mode]);

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

  const analyticsLoading =
    mode === "triage"
      ? canLoadOrgInsights && insightsQuery.isLoading
      : isAdminView && reportsQuery.isLoading;

  return {
    selectedOrgName,
    isAdminView,
    loading: dashboardQuery.isLoading && Boolean(selectedOrgId),
    analyticsLoading,
    isError: dashboardQuery.isError || insightsQuery.isError || reportsQuery.isError,
    snapshot: snap,
    orgInsights: snap?.orgInsights,
    personalMetrics,
    triageBuckets,
  };
}
