"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { DashboardAlertsPanel } from "../DashboardAlertsPanel";
import { DashboardKpiStrip } from "../DashboardKpiStrip";
import { DashboardPerformanceInsights } from "../DashboardPerformanceInsights";
import { DashboardSpotlightShipment } from "../DashboardSpotlightShipment";
import { DashboardSyncHealth } from "../DashboardSyncHealth";
import {
  TRACKING_DASHBOARD_GRID_CLASS,
  TRACKING_DASHBOARD_HEADER_COPY_CLASS,
  TRACKING_DASHBOARD_HEADER_TITLE_CLASS,
  TRACKING_DASHBOARD_SHELL_CLASS,
  TRACKING_DASHBOARD_SPAN_FULL,
  TRACKING_DASHBOARD_SPAN_MAIN,
  TRACKING_DASHBOARD_SPAN_SIDE,
} from "./constants";
import { useTrackingDashboard } from "./useTrackingDashboard";

const DashboardCharts = dynamic(
  () => import("../DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading charts...</p>
      </div>
    ),
  },
);

export function TrackingDashboard() {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const {
    selectedOrgName,
    isAdminView,
    loading,
    isError,
    snapshot,
    personalMetrics,
    triageBuckets,
  } = useTrackingDashboard();

  return (
    <div className={TRACKING_DASHBOARD_SHELL_CLASS}>
      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-200">
            Could not load dashboard data. Try refreshing the page.
          </p>
        </div>
      ) : null}

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
      ) : selectedOrgId ? (
        <div className={TRACKING_DASHBOARD_GRID_CLASS}>
          <div className={TRACKING_DASHBOARD_SPAN_FULL}>
            <DashboardKpiStrip
              isAdminView={isAdminView}
              orgMetrics={snapshot?.orgMetrics}
              personalMetrics={personalMetrics}
              loading={loading}
            />
          </div>

          <div className={TRACKING_DASHBOARD_SPAN_MAIN}>
            <DashboardAlertsPanel
              loading={loading}
              userId={snapshot?.currentUserId ?? null}
              buckets={triageBuckets}
              isAdminView={isAdminView}
            />
          </div>

          <div className={TRACKING_DASHBOARD_SPAN_SIDE}>
            {isAdminView ? (
              <DashboardSpotlightShipment spotlight={snapshot?.spotlightShipment} />
            ) : (
              <DashboardSyncHealth metrics={personalMetrics} loading={loading} />
            )}
          </div>

          <div className={TRACKING_DASHBOARD_SPAN_FULL}>
            {isAdminView ? (
              <DashboardPerformanceInsights
                insights={snapshot?.performanceInsights}
                loading={loading}
              />
            ) : null}
          </div>

          <div className={TRACKING_DASHBOARD_SPAN_FULL}>
            <DashboardCharts
              isAdminView={isAdminView}
              personalMetrics={personalMetrics}
              orgMetrics={snapshot?.orgMetrics}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
