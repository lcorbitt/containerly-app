"use client";

import { TrackingDashboard } from "@/app/(authenticated)/dashboard/components/TrackingDashboard";
import { DashboardPerformanceInsights } from "@/app/(authenticated)/dashboard/components/DashboardPerformanceInsights";
import { useTrackingDashboard } from "@/app/(authenticated)/dashboard/components/TrackingDashboard/useTrackingDashboard";

export function ReportsPageContent() {
  const { isAdminView, loading, snapshot } = useTrackingDashboard();

  if (!isAdminView) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Organization admin access is required to view performance reports.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardPerformanceInsights insights={snapshot?.performanceInsights} loading={loading} />
      <TrackingDashboard />
    </div>
  );
}
