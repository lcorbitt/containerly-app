"use client";

import { CreateOrgForm } from "@/app/(authenticated)/admin/organizations/components/CreateOrgForm";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";

export function AdminOrganizationsPanel() {
  const { orgs, selectedOrgId, setSelectedOrgId, refreshOrgs } = useOrganizationWorkspace();

  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Platform operators (<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">profiles.role
        = superadmin</code>) bypass RLS and manage orgs here. That is separate from{" "}
        <strong>org admins</strong> (<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">
          organization_members.role = admin
        </code>
        ), who only manage their tenant. Promote platform users via SQL or the Users page.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-500">Active organization</span>
          <select
            className="min-w-48 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            value={selectedOrgId ?? ""}
            onChange={(e) => setSelectedOrgId(e.target.value || null)}
            disabled={orgs.length === 0}
          >
            {orgs.length === 0 ? (
              <option value="">No organizations yet</option>
            ) : (
              orgs.map((row) =>
                row.organizations ? (
                  <option key={row.organizations.id} value={row.organizations.id}>
                    {row.organizations.name} ({row.role})
                  </option>
                ) : null,
              )
            )}
          </select>
        </label>
      </div>

      <CreateOrgForm
        onCreated={(id) => {
          void refreshOrgs().then(() => setSelectedOrgId(id));
        }}
      />
    </div>
  );
}
