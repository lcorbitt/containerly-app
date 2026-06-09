"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { TextInput } from "@/components/TextInput";
import { useCustomerDirectoryQuery } from "@/hooks/queries/useOrganization";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useMemo, useState } from "react";
import {
  CUSTOMERS_DIRECTORY_HEADER_CLASS,
  CUSTOMERS_DIRECTORY_PANEL_CLASS,
  CUSTOMERS_DIRECTORY_ROW_CLASS,
} from "./constants";

function formatActivity(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CustomersDirectory() {
  const { selectedOrgId } = useOrganizationWorkspace();
  const query = useCustomerDirectoryQuery(selectedOrgId);
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const list = query.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (row) =>
        row.email.toLowerCase().includes(term) ||
        row.display_name?.toLowerCase().includes(term),
    );
  }, [query.data, search]);

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Select an organization to view portal customers.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TextInput
        id="customers-directory-search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or name…"
        className="max-w-md"
      />

      <section className={CUSTOMERS_DIRECTORY_PANEL_CLASS} aria-busy={query.isLoading}>
        <div className={CUSTOMERS_DIRECTORY_HEADER_CLASS}>
          <span>Customer</span>
          <span>Portal Activity</span>
        </div>
        {query.isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading customers…
          </div>
        ) : rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No portal customers yet. Invite partners from a shipment Share menu.
          </p>
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.email} className={CUSTOMERS_DIRECTORY_ROW_CLASS}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {row.display_name ?? row.email}
                  </p>
                  {row.display_name ? (
                    <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">{row.email}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-zinc-500">
                    {row.active_shipment_count}{" "}
                    {row.active_shipment_count === 1 ? "Shipment" : "Shipments"}
                    {row.pending_invite_count > 0
                      ? ` · ${row.pending_invite_count} Pending Invite${row.pending_invite_count === 1 ? "" : "s"}`
                      : ""}
                    {row.pending_request_count > 0
                      ? ` · ${row.pending_request_count} Access Request${row.pending_request_count === 1 ? "" : "s"}`
                      : ""}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <p>Last activity</p>
                  <p className="mt-0.5 font-medium text-zinc-700 dark:text-zinc-300">
                    {formatActivity(row.last_activity_at)}
                  </p>
                  {row.pending_request_count > 0 ? (
                    <Link
                      href="/alerts"
                      className="mt-2 inline-block text-xs font-medium text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
                    >
                      Review Request
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
