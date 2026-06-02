"use client";

import { DASHBOARD_SECTION_TITLE_CLASS } from "@/app/(authenticated)/dashboard/constants";
import { TrackingDashboard } from "@/app/(authenticated)/dashboard/components/TrackingDashboard";
import { useTrackingDashboard } from "@/app/(authenticated)/dashboard/components/TrackingDashboard/useTrackingDashboard";

export function ReportsPageContent() {
  const { isAdminView } = useTrackingDashboard();

  if (!isAdminView) {
    return (
      <p className="mx-auto max-w-[72rem] px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400 lg:px-8">
        Organization admin access is required to view performance reports.
      </p>
    );
  }

  return (
    <>
      <header className="mx-auto max-w-[72rem] px-6 pt-8 lg:px-8">
        <h1 className={DASHBOARD_SECTION_TITLE_CLASS}>Reports</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Performance insights and operational trends for your organization.
        </p>
      </header>
      <TrackingDashboard embedded />
    </>
  );
}
