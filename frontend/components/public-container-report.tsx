"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/contexts/toast";
import { postPublicReportMessage } from "@/lib/supabase/public-edge";
import { ContainerTimeline, formatTimelineWhen } from "@/components/container-timeline";
import { ShipmentDetailsPanel } from "@/components/shipment-details-panel";
import { CarrierReportedStatusPill, TrackingWorkflowStatusPill } from "@/components/status-pills";
import { riskInsightBadgeClass } from "@/lib/report-insights";
import type { PublicReportPayload } from "@/types/public-report";

function SubmitSpinner() {
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

export function PublicContainerReport({
  reportId,
  initial,
}: {
  reportId: string;
  initial: PublicReportPayload;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [payload, setPayload] = useState(initial);
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  async function refresh() {
    const mod = await import("@/lib/supabase/public-edge");
    const r = await mod.fetchPublicReport(reportId);
    if (r.ok) setPayload(r.data);
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = body.trim();
    if (!t) return;
    setSending(true);
    try {
      const r = await postPublicReportMessage({
        reportId,
        body: t,
        authorDisplayName: name.trim() || undefined,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      setBody("");
      await refresh();
      toast("Message sent", "success");
    } finally {
      setSending(false);
    }
  }

  const { report, organization, summary, insights, timeline, alerts, messages } = payload;
  const fresh =
    summary.freshness_minutes != null
      ? summary.freshness_minutes < 120
        ? `${summary.freshness_minutes} min ago`
        : `${Math.round(summary.freshness_minutes / 60)} h ago`
      : "unknown";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {organization?.name ?? "Shipment report"}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {report.title ?? `Container ${summary.container_number}`}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${riskInsightBadgeClass(insights.risk_level)}`}
          >
            {insights.risk_level.toUpperCase()} risk
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Carrier data updated {fresh}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{insights.headline}</p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Status</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Container</dt>
            <dd className="font-mono font-medium text-zinc-900 dark:text-zinc-50">
              {summary.container_number}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Carrier</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{summary.carrier ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Tracking sync</dt>
            <dd className="mt-0.5">
              <TrackingWorkflowStatusPill status={summary.tracking_request_status} />
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Reported status</dt>
            <dd className="mt-0.5">
              <CarrierReportedStatusPill status={summary.status} />
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Last known location</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              {summary.last_known_location != null
                ? String(summary.last_known_location)
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <ShipmentDetailsPanel
        location={summary.shipment_context}
        title="Shipment details"
        subtitle="Latest carrier-reported facts for this container."
        className="mb-8 border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      />

      <ContainerTimeline events={timeline} interactiveDetail={false} />

      {alerts.length > 0 ? (
        <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
          <h2 className="mb-2 text-sm font-semibold text-amber-950 dark:text-amber-100">Alerts</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {alerts.map((a) => (
              <li key={a.id} className="rounded-lg border border-amber-200/60 bg-white/80 px-3 py-2 dark:border-amber-900/40 dark:bg-zinc-950/40">
                <span className="font-medium text-amber-950 dark:text-amber-100">{a.severity}</span>
                <span className="text-amber-800/80 dark:text-amber-200/80"> · {a.alert_type}</span>
                <p className="text-zinc-800 dark:text-zinc-200">{a.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Updates</h2>
        <ul className="mb-4 flex flex-col gap-3">
          {messages.length === 0 ? (
            <li className="text-sm text-zinc-500">No messages yet.</li>
          ) : (
            messages.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <p className="text-xs text-zinc-500">
                  {m.author_display_name ?? "Update"} · {formatTimelineWhen(m.created_at)}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{m.body}</p>
              </li>
            ))
          )}
        </ul>
        <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Your name (optional)
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              maxLength={120}
              placeholder="e.g. Alex"
            />
          </label>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Message
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={4000}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Ask a question or leave a note for the logistics team."
            />
          </label>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-9 min-w-[8.5rem] items-center justify-center gap-2 self-start rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {sending ? (
              <>
                <SubmitSpinner />
                <span>Sending…</span>
              </>
            ) : (
              <span>Send message</span>
            )}
          </button>
        </form>
      </section>

      {payload.raw_external ? (
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
          <button
            type="button"
            onClick={() => setRawOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Raw carrier payload
            <span className="text-zinc-400">{rawOpen ? "▼" : "▶"}</span>
          </button>
          {rawOpen ? (
            <pre className="max-h-96 overflow-auto border-t border-zinc-200 p-4 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              {JSON.stringify(payload.raw_external, null, 2)}
            </pre>
          ) : null}
        </section>
      ) : null}

      <footer className="border-t border-zinc-200 pt-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Powered by Containerly · Carrier data is indicative and may change.
      </footer>
    </div>
  );
}
