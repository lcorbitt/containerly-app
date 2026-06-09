"use client";

import { InviteNewTenantForm } from "../InviteNewTenantForm";
import { InviteToOrganizationForm } from "../InviteToOrganizationForm";
import { AdminTenantInvitesTable } from "../AdminTenantInvitesTable";
import { ADMIN_INVITES_CARD_CLASS } from "./constants";

export function AdminInvitesPanel() {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Use <strong>Invite to Organization</strong> when someone should join an existing tenant. Use{" "}
        <strong>Invite New Tenant</strong> when a new operator company should create their own organization
        after accepting the invite.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={ADMIN_INVITES_CARD_CLASS}>
          <InviteToOrganizationForm />
        </section>
        <section className={ADMIN_INVITES_CARD_CLASS}>
          <InviteNewTenantForm />
        </section>
      </div>

      <AdminTenantInvitesTable />
    </div>
  );
}
