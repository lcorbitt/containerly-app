"use client";

import { useState } from "react";
import { GrantAccessSettingsEditor } from "../GrantAccessSettings";
import { TextInput } from "@/components/TextInput";
import { WorkspacePostSpinner } from "@/components/WorkspacePostSpinner";
import { useConfirm } from "@/contexts/confirm-dialog";
import { formatTimestamp } from "@/utils/datetime";
import type { CustomerInvite, ShipmentCustomerAccess } from "@/types/database";

const PRIMARY_BTN =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";

export function CustomerAccessPanel({
  inviteEmail,
  inviteFieldError,
  onInviteEmailChange,
  deliveryMode,
  onDeliveryModeChange,
  creating,
  onCreateInvite,
  lastInviteUrl,
  onClearLastInviteUrl,
  pendingInvites,
  activeAccess,
  origin,
  onRevokeInvite,
  onRevokeAccess,
  onToast,
  onReloadAccess,
  variant = "panel",
}: {
  inviteEmail: string;
  inviteFieldError?: string | null;
  onInviteEmailChange: (v: string) => void;
  deliveryMode: "email_invite" | "allowlist_only";
  onDeliveryModeChange: (v: "email_invite" | "allowlist_only") => void;
  creating: boolean;
  onCreateInvite: () => void;
  lastInviteUrl: string | null;
  onClearLastInviteUrl: () => void;
  pendingInvites: CustomerInvite[];
  activeAccess: { access: ShipmentCustomerAccess; label: string }[];
  origin: string;
  onRevokeInvite: (id: string) => Promise<void>;
  onRevokeAccess: (id: string) => Promise<void>;
  onToast: (message: string, variant: "success" | "error" | "info") => void;
  onReloadAccess: () => Promise<void>;
  /** Sidebar layout scrolls with the page; panel layout keeps an internal scroll region. */
  variant?: "panel" | "sidebar";
}) {
  const { confirm } = useConfirm();
  const [copyBusy, setCopyBusy] = useState(false);

  async function copyUrl(url: string) {
    setCopyBusy(true);
    try {
      await navigator.clipboard.writeText(url);
      onToast("Link copied", "success");
    } catch {
      onToast("Could not copy", "error");
    } finally {
      setCopyBusy(false);
    }
  }

  const isSidebar = variant === "sidebar";

  return (
    <div className={isSidebar ? "flex flex-col" : "flex min-h-0 flex-1 flex-col overflow-hidden"}>
      <div className="shrink-0 space-y-3 border-b border-zinc-100 dark:border-zinc-800">
        <label
          id="customers-label"
          className="block text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
        >
          Customers
        </label>
        <div className="flex flex-wrap gap-2 text-xs">
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              checked={deliveryMode === "email_invite"}
              onChange={() => onDeliveryModeChange("email_invite")}
            />
            Send invite email
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              checked={deliveryMode === "allowlist_only"}
              onChange={() => onDeliveryModeChange("allowlist_only")}
            />
            Allowlist only
          </label>
        </div>
        <div className="flex flex-col gap-3">
          <label className="min-w-0 flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Customer emails
            <TextInput
              type="text"
              value={inviteEmail}
              onChange={(e) => onInviteEmailChange(e.target.value)}
              containerClassName="mt-1"
              className={`w-full rounded-md border bg-white px-3 py-2 text-xs dark:bg-zinc-950 ${
                inviteFieldError
                  ? "border-red-400 dark:border-red-600"
                  : "border-zinc-200 dark:border-zinc-700"
              }`}
              placeholder="Email or group, separated by commas"
              autoComplete="off"
              aria-invalid={inviteFieldError ? true : undefined}
              aria-describedby={inviteFieldError ? "customer-invite-email-error" : undefined}
            />
            {inviteFieldError ? (
              <p
                id="customer-invite-email-error"
                role="alert"
                className="mt-1.5 text-xs text-red-600 dark:text-red-400"
              >
                {inviteFieldError}
              </p>
            ) : null}
          </label>
          <button
            type="button"
            onClick={onCreateInvite}
            disabled={creating}
            className={`${PRIMARY_BTN} w-full`}
          >
            {creating ? (
              <>
                <WorkspacePostSpinner />
                <span>Sending…</span>
              </>
            ) : (
              <span>{inviteEmail.includes(",") ? "Send invites" : "Send invite"}</span>
            )}
          </button>
        </div>
        {lastInviteUrl ? (
          <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
              Copy this link once
            </p>
            <p className="mt-1 break-all font-mono text-xs text-emerald-950 dark:text-emerald-100">
              {lastInviteUrl.startsWith("http") ? lastInviteUrl : `${origin}${lastInviteUrl}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={copyBusy}
                onClick={() =>
                  void copyUrl(lastInviteUrl.startsWith("http") ? lastInviteUrl : `${origin}${lastInviteUrl}`)
                }
                className="rounded-md bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-900 disabled:opacity-50 dark:bg-emerald-700"
              >
                Copy link
              </button>
              <button
                type="button"
                onClick={onClearLastInviteUrl}
                className="text-xs font-medium text-emerald-800 underline dark:text-emerald-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className={isSidebar ? "pt-4" : "min-h-0 flex-1 overflow-y-auto overscroll-contain p-4"}>
        {pendingInvites.length > 0 ? (
          <div className="mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Pending invites</p>
            <ul className="mt-2 flex flex-col gap-2">
              {pendingInvites.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-col gap-2 rounded-lg border border-amber-200/80 p-3 dark:border-amber-900/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">{inv.invited_email}</p>
                    <p className="text-xs text-zinc-500">
                      Expires {formatTimestamp(inv.expires_at)} · link was shown when invite was created
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-red-600 underline dark:text-red-400"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Revoke invite?",
                        description: "They won’t be able to accept this invite anymore.",
                        confirmLabel: "Revoke",
                        cancelLabel: "Cancel",
                        variant: "danger",
                      });
                      if (!ok) return;
                      await onRevokeInvite(inv.id);
                    }}
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {activeAccess.length === 0 && pendingInvites.length === 0 ? (
          <p className="text-sm text-zinc-500">No customer access yet.</p>
        ) : null}

        {activeAccess.length > 0 ? (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Active access</p>
            <ul className="mt-2 flex flex-col gap-2">
              {activeAccess.map(({ access, label }) => (
                <li
                  key={access.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</p>
                    <p className="text-xs text-zinc-500">Importer account · since {formatTimestamp(access.created_at)}</p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-medium text-red-600 underline dark:text-red-400"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Revoke importer access?",
                        description: "They will no longer see this shipment or documents.",
                        confirmLabel: "Revoke",
                        cancelLabel: "Cancel",
                        variant: "danger",
                      });
                      if (!ok) return;
                      await onRevokeAccess(access.id);
                    }}
                  >
                    Revoke access
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-4 border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                Importer portal settings
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tune visibility and overrides per invited importer. Use Preview to see the merged shipment page before
                they do.
              </p>
              {activeAccess.map(({ access, label }) => (
                <GrantAccessSettingsEditor
                  key={access.id}
                  access={access}
                  granteeLabel={label}
                  onSaved={() => void onReloadAccess()}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
