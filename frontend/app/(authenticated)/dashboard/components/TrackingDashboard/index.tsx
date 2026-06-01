"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { DashboardAlertsPanel } from "../DashboardAlertsPanel";
import { DashboardKpiStrip } from "../DashboardKpiStrip";
import { DashboardMessageThreads } from "../DashboardMessageThreads";
import { DashboardSpotlightShipment } from "../DashboardSpotlightShipment";
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
    messageThreads,
    messagesLoading,
  } = useTrackingDashboard();

  return (
    <div className={TRACKING_DASHBOARD_SHELL_CLASS}>
      <header className="flex flex-col gap-2">
        <h1 className={TRACKING_DASHBOARD_HEADER_TITLE_CLASS}>Dashboard</h1>
        <p className={TRACKING_DASHBOARD_HEADER_COPY_CLASS}>
          {isAdminView ? (
            <>
              Org-wide metrics for <span className="font-medium text-zinc-800 dark:text-zinc-200">{selectedOrgName ?? "your organization"}</span>
              , with personal action items below. Browse every shipment under{" "}
              <Link href="/shipments" className="font-medium text-zinc-800 underline dark:text-zinc-200">
                Shipments
              </Link>
              .
            </>
          ) : (
            <>
              Your workload and triage for shipments you own or collaborate on. Browse every shipment under{" "}
              <Link href="/shipments" className="font-medium text-zinc-800 underline dark:text-zinc-200">
                Shipments
              </Link>
              .
            </>
          )}
        </p>
      </header>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm text-red-800 dark:text-red-200">Could not load dashboard data. Try refreshing the page.</p>
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

          {isAdminView ? (
            <div className={TRACKING_DASHBOARD_SPAN_SIDE}>
              <DashboardSpotlightShipment spotlight={snapshot?.spotlightShipment} />
            </div>
          ) : (
            <div className={TRACKING_DASHBOARD_SPAN_SIDE}>
              <DashboardCharts
                isAdminView={false}
                personalMetrics={personalMetrics}
                orgMetrics={snapshot?.orgMetrics}
              />
            </div>
          )}

          {isAdminView ? (
            <>
              <div className={TRACKING_DASHBOARD_SPAN_MAIN}>
                <DashboardCharts
                  isAdminView
                  personalMetrics={personalMetrics}
                  orgMetrics={snapshot?.orgMetrics}
                />
              </div>
              <div className={TRACKING_DASHBOARD_SPAN_SIDE}>
                <DashboardMessageThreads threads={messageThreads} loading={messagesLoading} />
              </div>
            </>
          ) : (
            <div className={TRACKING_DASHBOARD_SPAN_FULL}>
              <DashboardMessageThreads threads={messageThreads} loading={messagesLoading} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
