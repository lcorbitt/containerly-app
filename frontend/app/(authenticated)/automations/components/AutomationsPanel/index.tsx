"use client";

import Link from "next/link";
import { OrganizationPerformanceSettings } from "@/app/(authenticated)/settings/components/OrganizationPerformanceSettings";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { canManageOrganizationSettings } from "@/utils/org-role";
import {
  AUTOMATION_RULE_TEMPLATES,
  AUTOMATIONS_GROWTH_BADGE_CLASS,
  AUTOMATIONS_RULE_CARD_CLASS,
} from "./constants";

export function AutomationsPanel() {
  const { orgs, selectedOrgId, isSuperAdmin } = useOrganizationWorkspace();
  const selectedRow = orgs.find((r) => r.organizations?.id === selectedOrgId);
  const canEdit = canManageOrganizationSettings(isSuperAdmin, selectedRow?.role ?? null);

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Select an organization to configure automations.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Automation rules route delays and exceptions to the right owners on Growth plans. Configure
        guardrails below — each rule ties back to the shipment record and portal evidence.
      </p>

      <div className="grid gap-4 md:grid-cols-3">
        {AUTOMATION_RULE_TEMPLATES.map((rule) => (
          <article key={rule.id} className={AUTOMATIONS_RULE_CARD_CLASS}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{rule.title}</h2>
              <span className={AUTOMATIONS_GROWTH_BADGE_CLASS}>Growth</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{rule.description}</p>
          </article>
        ))}
      </div>

      {canEdit ? (
        <OrganizationPerformanceSettings />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Organization admin access is required to edit automation guardrails. Ask an admin to update
          settings or visit{" "}
          <Link href="/settings" className="font-medium underline-offset-2 hover:underline">
            Settings
          </Link>
          .
        </p>
      )}
    </div>
  );
}
