"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { createClient } from "@/lib/supabase/client";
import type { Alert } from "@/types/database";

function severityClass(sev: string): string {
  if (sev === "critical") return "text-red-600 dark:text-red-400";
  if (sev === "warning") return "text-amber-700 dark:text-amber-300";
  return "text-zinc-600 dark:text-zinc-400";
}

export function AlertsBell() {
  const { selectedOrgId } = useOrganizationWorkspace();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedOrgId) return;
    const supabase = createClient();
    let cancelled = false;

    async function pull() {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("organization_id", selectedOrgId)
        .order("created_at", { ascending: false })
        .limit(25);
      if (cancelled || error) return;
      setAlerts((data as Alert[]) ?? []);
    }

    const channel = supabase
      .channel(`alerts-org-${selectedOrgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
          filter: `organization_id=eq.${selectedOrgId}`,
        },
        () => {
          void pull();
        },
      )
      .subscribe();

    void pull();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [selectedOrgId]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  if (!selectedOrgId) {
    return null;
  }

  const unacked = alerts.filter((a) => !a.acknowledged_at).length;
  const preview = alerts.slice(0, 8);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
        {unacked > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white dark:bg-red-500">
            {unacked > 9 ? "9+" : unacked}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] origin-top-right rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-950"
          role="dialog"
          aria-label="Recent alerts"
        >
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Alerts</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {unacked > 0 ? `${unacked} unacknowledged` : "You are caught up"}
            </p>
          </div>
          <ul className="max-h-[min(60vh,20rem)] overflow-y-auto py-1">
            {preview.length === 0 ? (
              <li className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No alerts for this organization.
              </li>
            ) : (
              preview.map((a) => (
                <li key={a.id} className="border-b border-zinc-50 last:border-0 dark:border-zinc-900">
                  {a.tracking_request_id ? (
                    <Link
                      href={`/requests/${a.tracking_request_id}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
                    >
                      <span className={`text-xs font-medium uppercase tracking-wide ${severityClass(a.severity)}`}>
                        {a.severity}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500"> · {a.alert_type}</span>
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-800 dark:text-zinc-200">{a.message}</p>
                      <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                        {new Date(a.created_at).toLocaleString()}
                      </p>
                    </Link>
                  ) : (
                    <div className="px-4 py-2.5">
                      <span className={`text-xs font-medium uppercase tracking-wide ${severityClass(a.severity)}`}>
                        {a.severity}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500"> · {a.alert_type}</span>
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-800 dark:text-zinc-200">{a.message}</p>
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
          <div className="border-t border-zinc-100 p-2 dark:border-zinc-800">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-zinc-900 underline-offset-2 hover:underline dark:text-zinc-100"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
