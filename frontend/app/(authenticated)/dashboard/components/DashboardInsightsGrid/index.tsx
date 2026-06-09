"use client";

import dynamic from "next/dynamic";
import { DASHBOARD_PANEL_BODY_CLASS, DASHBOARD_PANEL_CLASS } from "../../constants";
import { DashboardBreakdownCard } from "../DashboardBreakdownCard";
import {
  buildAlertBreakdownRows,
  buildAssignmentBreakdownRows,
  buildRiskBreakdownRows,
  buildRootCauseBreakdownRows,
  buildWorkflowBreakdownRows,
} from "@/utils/dashboard-insights";
import {
  DASHBOARD_INSIGHTS_GRID_CLASS,
  DASHBOARD_INSIGHTS_SECTION_DESC_CLASS,
  DASHBOARD_INSIGHTS_SECTION_TITLE_CLASS,
} from "./constants";
import type { DashboardInsightsGridProps } from "./types";

const DashboardTimeToResolveChart = dynamic(
  () => import("../DashboardTimeToResolveChart").then((m) => m.DashboardTimeToResolveChart),
  {
    ssr: false,
    loading: () => (
      <div className={DASHBOARD_PANEL_CLASS}>
        <div className={DASHBOARD_PANEL_BODY_CLASS}>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading chart…</p>
        </div>
      </div>
    ),
  },
);

export function DashboardInsightsGrid({ orgInsights, loading = false }: DashboardInsightsGridProps) {
  const riskRows = orgInsights ? buildRiskBreakdownRows(orgInsights.riskCounts) : [];
  const workflowRows = orgInsights ? buildWorkflowBreakdownRows(orgInsights.workflowCounts) : [];
  const assignmentRows = orgInsights ? buildAssignmentBreakdownRows(orgInsights.assignmentCounts) : [];
  const alertRows = orgInsights ? buildAlertBreakdownRows(orgInsights.alertSummary) : [];
  const rootCauseRows = orgInsights ? buildRootCauseBreakdownRows(orgInsights.rootCauseCounts) : [];

  return (
    <section aria-labelledby="dashboard-insights-heading">
      <header className="mb-6">
        <h2 id="dashboard-insights-heading" className={DASHBOARD_INSIGHTS_SECTION_TITLE_CLASS}>
          Organization Insights
        </h2>
        <p className={DASHBOARD_INSIGHTS_SECTION_DESC_CLASS}>
          Org-wide shipment risk, documents, assignments, alerts, and resolve trends.
        </p>
      </header>

      <div className={DASHBOARD_INSIGHTS_GRID_CLASS}>
        <DashboardBreakdownCard
          eyebrow="Shipments"
          title="Shipment Risk"
          subtitle="Operator-assigned risk levels"
          rows={riskRows}
          loading={loading}
          emptyMessage="No shipments yet."
          linkHref="/shipments"
          linkLabel="View Shipments"
        />

        <DashboardBreakdownCard
          eyebrow="Documents"
          title="Document Status"
          subtitle="Shipments by workflow stage"
          rows={workflowRows}
          loading={loading}
          emptyMessage="No document workflow data yet."
          linkHref="/shipments"
          linkLabel="View Shipments"
        />

        <DashboardBreakdownCard
          eyebrow="Team"
          title="Shipment Assignments"
          subtitle="Primary assignee coverage"
          rows={assignmentRows}
          loading={loading}
          emptyMessage="No shipments yet."
          linkHref="/shipments"
          linkLabel="View Shipments"
        />

        <DashboardBreakdownCard
          eyebrow="Alerts"
          title="Alerts Summary"
          subtitle="Open alerts, severity, and top types"
          rows={alertRows}
          loading={loading}
          emptyMessage="No alerts yet."
          linkHref="/alerts"
          linkLabel="View Alerts"
          totalOverride={
            orgInsights
              ? orgInsights.alertSummary.open + orgInsights.alertSummary.acknowledged
              : undefined
          }
        />

        <DashboardBreakdownCard
          eyebrow="Root Cause"
          title="Top Reasons for Alerts"
          subtitle="Tagged shipment root causes"
          rows={rootCauseRows}
          loading={loading}
          emptyMessage="No root causes tagged yet."
          linkHref="/shipments"
          linkLabel="View Shipments"
        />

        <DashboardTimeToResolveChart
          series={orgInsights?.timeToResolveSeries ?? []}
          loading={loading}
        />
      </div>
    </section>
  );
}
