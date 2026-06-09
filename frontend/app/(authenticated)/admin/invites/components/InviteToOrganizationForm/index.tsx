"use client";

import {
  ADMIN_INVITES_SUBMIT_CLASS,
  INVITE_TO_ORG_DESCRIPTION,
  INVITE_TO_ORG_TITLE,
} from "../AdminInvitesPanel/constants";
import { useInviteToOrganizationForm } from "./useInviteToOrganizationForm";

export function InviteToOrganizationForm() {
  const f = useInviteToOrganizationForm();

  return (
    <form onSubmit={(e) => void f.submit(e)} className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {INVITE_TO_ORG_TITLE}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{INVITE_TO_ORG_DESCRIPTION}</p>
      </div>

      <div>
        <label htmlFor="admin-invite-org" className="text-sm text-zinc-500">
          {f.orgLabel}
        </label>
        <select
          id="admin-invite-org"
          className={`${f.inputClass} mt-1`}
          value={f.organizationId}
          onChange={(e) => f.setOrganizationId(e.target.value)}
          required
          disabled={f.loading || f.orgs.length === 0}
        >
          <option value="" disabled>
            {f.orgs.length === 0 ? "No organizations yet" : "Select organization"}
          </option>
          {f.orgs.map((row) =>
            row.organizations ? (
              <option key={row.organizations.id} value={row.organizations.id}>
                {row.organizations.name}
              </option>
            ) : null,
          )}
        </select>
      </div>

      <div>
        <label htmlFor="admin-invite-email" className="text-sm text-zinc-500">
          {f.emailLabel}
        </label>
        <input
          id="admin-invite-email"
          type="email"
          className={`${f.inputClass} mt-1`}
          value={f.email}
          onChange={(e) => f.setEmail(e.target.value)}
          required
          disabled={f.loading}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="admin-invite-role" className="text-sm text-zinc-500">
          {f.roleLabel}
        </label>
        <select
          id="admin-invite-role"
          className={`${f.inputClass} mt-1`}
          value={f.role}
          onChange={(e) => f.setRole(e.target.value as typeof f.role)}
          disabled={f.loading}
        >
          {f.roleOptions.map((option) => (
            <option key={option} value={option}>
              {option === "admin" ? "Admin" : "Member"}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={f.loading} className={ADMIN_INVITES_SUBMIT_CLASS}>
        {f.submitLabel}
      </button>
    </form>
  );
}
