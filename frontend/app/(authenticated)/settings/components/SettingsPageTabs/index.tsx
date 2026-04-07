"use client";

import { Building2, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { OrganizationSettingsPanel } from "../OrganizationSettingsPanel";
import { ProfileImageSettings } from "../ProfileImageSettings";
import { SettingsDisplayName } from "../SettingsDisplayName";
import { canManageOrganizationSettings } from "@/utils/org-role";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";

type TabId = "personal" | "organization";

export type SettingsPageTabsProps = {
  userId: string;
  email: string;
  fullName: string;
  displayLabel: string;
  profileImagePath: string | null;
};

export function SettingsPageTabs({
  userId,
  email,
  fullName,
  displayLabel,
  profileImagePath,
}: SettingsPageTabsProps) {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const selectedRow = useMemo(
    () => orgs.find((r) => r.organizations?.id === selectedOrgId),
    [orgs, selectedOrgId],
  );
  const showOrganizationTab = canManageOrganizationSettings(
    isSuperAdmin,
    selectedRow?.role ?? null,
  );

  const [tab, setTab] = useState<TabId>("personal");

  useEffect(() => {
    if (!showOrganizationTab && tab === "organization") {
      setTab("personal");
    }
  }, [showOrganizationTab, tab]);

  const personalSection = (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Account
      </h2>
      <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:gap-10">
        <ProfileImageSettings
          userId={userId}
          initialProfileImagePath={profileImagePath}
          displayLabel={displayLabel}
          accountColumn
        />
        <div className="min-w-0 flex-1 space-y-5 text-sm">
          <div>
            <p className="text-zinc-500 dark:text-zinc-500">Email</p>
            <p className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{email || "—"}</p>
          </div>
          <SettingsDisplayName userId={userId} initialFullName={fullName} />
        </div>
      </div>
    </section>
  );

  if (!showOrganizationTab) {
    return <div className="mt-8">{personalSection}</div>;
  }

  return (
    <>
      <div
        role="tablist"
        aria-label="Settings sections"
        className="mt-8 flex w-full flex-col gap-2 rounded-xl bg-zinc-100/90 p-2 sm:flex-row dark:bg-zinc-900/80"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "personal"}
          id="settings-tab-personal"
          aria-controls="settings-panel-personal"
          onClick={() => setTab("personal")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            tab === "personal"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
          }`}
        >
          <User className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Personal
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "organization"}
          id="settings-tab-organization"
          aria-controls="settings-panel-organization"
          onClick={() => setTab("organization")}
          className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            tab === "organization"
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
          }`}
        >
          <Building2 className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
          Organization
        </button>
      </div>

      {tab === "personal" ? (
        <div
          role="tabpanel"
          id="settings-panel-personal"
          aria-labelledby="settings-tab-personal"
          className="mt-6"
        >
          {personalSection}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="settings-panel-organization"
          aria-labelledby="settings-tab-organization"
          className="mt-6"
        >
          <OrganizationSettingsPanel embedded />
        </div>
      )}
    </>
  );
}
