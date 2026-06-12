"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { PendingTenantOnboardingPrompt } from "@/components/PendingTenantOnboardingPrompt";
import { useOrganizationWorkspace } from "@/atoms/organization-workspace";
import { DASHBOARD_PAGE_INTRO_CLASS, DASHBOARD_PANEL_CLASS, DASHBOARD_PANEL_BODY_CLASS, DASHBOARD_SIDE_STACK_CLASS } from "../../constants";
import { DashboardAlertsPanel } from "../DashboardAlertsPanel";
import { DashboardInsightsGrid } from "../DashboardInsightsGrid";
import { DashboardKpiStrip } from "../DashboardKpiStrip";
import { DashboardPerformanceInsights } from "../DashboardPerformanceInsights";
import { DashboardSpotlightShipment } from "../DashboardSpotlightShipment";
import { DashboardSyncHealth } from "../DashboardSyncHealth";
import { DashboardTriageBreakdown } from "../DashboardTriageBreakdown";
import {
  TRACKING_DASHBOARD_GRID_CLASS,
  TRACKING_DASHBOARD_SHELL_CLASS,
  TRACKING_DASHBOARD_SPAN_MAIN,
  TRACKING_DASHBOARD_SPAN_SIDE,
} from "./constants";
import { useTrackingDashboard } from "./useTrackingDashboard";

const DashboardCharts = dynamic(
  () => import("../DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className={DASHBOARD_PANEL_CLASS}>
        <div className={DASHBOARD_PANEL_BODY_CLASS}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading charts…</p>
        </div>
      </div>
    ),
  },
);

const EMBEDDED_SHELL_CLASS =
  "mx-auto flex w-full max-w-[72rem] flex-col gap-10 px-6 pb-8 lg:px-8";

export function TrackingDashboard({
  embedded = false,
  mode = "triage",
}: {
  embedded?: boolean;
  /** triage = action items + workload; reports = trends + performance insights */
  mode?: "triage" | "reports";
}) {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const {
    selectedOrgName,
    isAdminView,
    loading,
    analyticsLoading,
    isError,
    snapshot,
    personalMetrics,
    triageBuckets,
    orgInsights,
  } = useTrackingDashboard(mode);

  const pageIntro =
    mode === "reports"
      ? isAdminView
        ? "Organization trends — workflow funnel, response times, and carrier performance."
        : "Your activity trends — carrier sync status and line volume over time."
      : isAdminView
        ? "Organization overview — what needs attention across your team today."
        : "Your workload — what needs attention and how your lines are syncing.";

  const spotlightContext =
    snapshot?.spotlightShipment && snapshot.triageActionContextByContainerId
      ? snapshot.triageActionContextByContainerId[snapshot.spotlightShipment.containerId]
      : null;

  return (
    <div className={embedded ? EMBEDDED_SHELL_CLASS : TRACKING_DASHBOARD_SHELL_CLASS}>
      {!embedded && selectedOrgId && orgs.length > 0 ? (
        <header>
          {selectedOrgName ? (
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{selectedOrgName}</p>
          ) : null}
          <p className={`${selectedOrgName ? "mt-1" : ""} ${DASHBOARD_PAGE_INTRO_CLASS}`}>{pageIntro}</p>
        </header>
      ) : null}

      {isError ? (
        <div className={`${DASHBOARD_PANEL_CLASS} border-red-200/80 dark:border-red-900/40`}>
          <div className={DASHBOARD_PANEL_BODY_CLASS}>
            <p className="text-sm text-red-700 dark:text-red-300">
              Could not load dashboard data. Try refreshing the page.
            </p>
          </div>
        </div>
      ) : null}

      {orgs.length === 0 ? (
        <div className={DASHBOARD_PANEL_CLASS}>
          <div className={DASHBOARD_PANEL_BODY_CLASS}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              You are not a member of any organization yet.
            </p>
            {!isSuperAdmin ? <PendingTenantOnboardingPrompt /> : null}
            {isSuperAdmin ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                As platform superadmin you still pick an org for context, or create one under{" "}
                <Link
                  href="/admin/organizations"
                  className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
                >
                  Platform → Organizations
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
      ) : selectedOrgId ? (
        <>
          <DashboardKpiStrip
            isAdminView={isAdminView}
            orgMetrics={snapshot?.orgMetrics}
            personalMetrics={personalMetrics}
            loading={loading || (mode === "reports" && isAdminView && analyticsLoading)}
          />

          {mode === "triage" ? (
            <div className={TRACKING_DASHBOARD_GRID_CLASS}>
              <div className={`${TRACKING_DASHBOARD_SPAN_MAIN} flex`}>
                <DashboardAlertsPanel
                  loading={loading}
                  userId={snapshot?.currentUserId ?? null}
                  buckets={triageBuckets}
                  actionContextByContainerId={snapshot?.triageActionContextByContainerId}
                  isAdminView={isAdminView}
                />
              </div>

              <div className={`${TRACKING_DASHBOARD_SPAN_SIDE} flex`}>
                <div className={DASHBOARD_SIDE_STACK_CLASS}>
                  {isAdminView ? (
                    <>
                      <DashboardSpotlightShipment
                        spotlight={snapshot?.spotlightShipment}
                        context={spotlightContext}
                      />
                      <DashboardTriageBreakdown
                        loading={loading}
                        isAdminView
                        orgTriageCounts={snapshot?.orgMetrics?.triageCounts}
                        buckets={triageBuckets}
                      />
                    </>
                  ) : (
                    <>
                      <DashboardSyncHealth metrics={personalMetrics} loading={loading} />
                      <DashboardTriageBreakdown
                        loading={loading}
                        isAdminView={false}
                        buckets={triageBuckets}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {mode === "triage" ? (
            <DashboardInsightsGrid
              orgInsights={orgInsights}
              loading={loading || analyticsLoading}
            />
          ) : null}

          {mode === "reports" && isAdminView ? (
            <DashboardPerformanceInsights
              insights={snapshot?.performanceInsights}
              loading={loading || analyticsLoading}
            />
          ) : null}

          {mode === "reports" ? (
            <section aria-label="Trends">
              <DashboardCharts
                isAdminView={isAdminView}
                personalMetrics={personalMetrics}
                orgMetrics={snapshot?.orgMetrics}
                loading={loading || (mode === "reports" && isAdminView && analyticsLoading)}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
