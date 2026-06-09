"use client";

import {
  ADMIN_INVITES_SUBMIT_CLASS,
  INVITE_NEW_TENANT_DESCRIPTION,
  INVITE_NEW_TENANT_TITLE,
} from "../AdminInvitesPanel/constants";
import { useInviteNewTenantForm } from "./useInviteNewTenantForm";

export function InviteNewTenantForm() {
  const f = useInviteNewTenantForm();

  return (
    <form onSubmit={(e) => void f.submit(e)} className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          {INVITE_NEW_TENANT_TITLE}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{INVITE_NEW_TENANT_DESCRIPTION}</p>
      </div>

      <div>
        <label htmlFor="admin-tenant-email" className="text-sm text-zinc-500">
          {f.emailLabel}
        </label>
        <input
          id="admin-tenant-email"
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
        <label htmlFor="admin-tenant-suggested-name" className="text-sm text-zinc-500">
          {f.suggestedNameLabel}
        </label>
        <input
          id="admin-tenant-suggested-name"
          type="text"
          className={`${f.inputClass} mt-1`}
          value={f.suggestedOrgName}
          onChange={(e) => f.setSuggestedOrgName(e.target.value)}
          disabled={f.loading}
          placeholder={f.suggestedNamePlaceholder}
          autoComplete="organization"
        />
      </div>

      <button type="submit" disabled={f.loading} className={ADMIN_INVITES_SUBMIT_CLASS}>
        {f.submitLabel}
      </button>
    </form>
  );
}
