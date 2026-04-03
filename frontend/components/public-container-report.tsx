"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Map as MapIcon, MessageSquare, Reply, Route } from "lucide-react";
import { ActionHoverTooltip } from "@/components/action-hover-tooltip";
import { AutoGrowTextarea } from "@/components/auto-grow-textarea";
import { useToast } from "@/contexts/toast";
import { postPublicReportMessage } from "@/lib/supabase/public-edge";
import { ContainerTimeline } from "@/components/container-timeline";
import { formatMessageTimestamp } from "@/lib/format-message-timestamp";
import { ShipmentDetailsPanel } from "@/components/shipment-details-panel";
import { ShipmentTrackingMapPanel } from "@/components/shipment-tracking-map";
import { CarrierReportedStatusPill, TrackingWorkflowStatusPill } from "@/components/status-pills";
import { riskInsightBadgeClass } from "@/lib/report-insights";
import { buildMessageTree, truncatedReplyPreview, type ThreadNode } from "@/lib/report-message-tree";
import type { PublicReportPayload, PublicThreadMessage } from "@/types/public-report";

function SubmitSpinner() {
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function publicThreadAuthorName(m: PublicThreadMessage): string {
  if (m.author_kind === "system") return "System";
  if (m.author_kind === "customer") return m.author_display_name?.trim() || "Customer";
  if (m.author_kind === "member") return m.author_display_name?.trim() || "Logistics team";
  return m.author_kind;
}

function PublicThreadItem({
  node,
  depth,
  replyTargetId,
  onReply,
  messageById,
}: {
  node: ThreadNode<PublicThreadMessage>;
  depth: number;
  replyTargetId: string | null;
  onReply: (id: string) => void;
  messageById: Map<string, PublicThreadMessage>;
}) {
  const parent = node.parent_message_id ? messageById.get(node.parent_message_id) : undefined;
  const isTarget = replyTargetId === node.id;
  const isRoot = depth === 0;

  const shell = isRoot
    ? "rounded-2xl bg-sky-50/90 px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:bg-sky-950/28 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
    : "rounded-xl bg-sky-50/55 px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:bg-sky-950/20 dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)]";

  return (
    <li className="list-none">
      <div
        className={`text-sm ${shell} ${
          isTarget
            ? "ring-2 ring-sky-400/45 ring-offset-2 ring-offset-sky-50 dark:ring-sky-500/35 dark:ring-offset-sky-950"
            : ""
        }`}
      >
        {parent ? (
          <div className="mb-4 border-l-[3px] border-sky-400/90 bg-sky-100/40 py-2 pr-2 pl-3 dark:border-sky-500/70 dark:bg-sky-950/35 rounded-r-md">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Replying to {publicThreadAuthorName(parent)}
            </p>
            <p className="mt-1 truncate text-[13px] leading-snug text-zinc-600 dark:text-zinc-300">
              {truncatedReplyPreview(parent.body)}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {publicThreadAuthorName(node)}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatMessageTimestamp(node.created_at)}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-zinc-800 dark:text-zinc-200">{node.body}</p>
        <ActionHoverTooltip label="Reply">
          <button
            type="button"
            onClick={() => onReply(node.id)}
            aria-label="Reply to this message"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <Reply className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Reply
          </button>
        </ActionHoverTooltip>
      </div>
      {node.children.length > 0 ? (
        <ul className="relative mt-6 flex flex-col gap-6 border-l-2 border-zinc-300 pl-6 dark:border-zinc-600">
          {node.children.map((c) => (
            <PublicThreadItem
              key={c.id}
              node={c}
              depth={depth + 1}
              replyTargetId={replyTargetId}
              onReply={onReply}
              messageById={messageById}
            />
          ))}
        </ul>
      ) : null}
    </li>
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
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<"tracking" | "map" | "documents" | "messages">("tracking");

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
        parentMessageId: replyParentId,
      });
      if (!r.ok) {
        toast(r.error, "error");
        return;
      }
      setBody("");
      setReplyParentId(null);
      await refresh();
      toast("Message sent", "success");
    } finally {
      setSending(false);
    }
  }

  const { report, organization, summary, insights, timeline, alerts, messages } = payload;
  const messageTree = useMemo(() => buildMessageTree(messages), [messages]);
  const messageById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);
  const replyPreview = useMemo(() => {
    if (!replyParentId) return null;
    const m = messages.find((x) => x.id === replyParentId);
    if (!m) return null;
    return { label: publicThreadAuthorName(m), excerpt: truncatedReplyPreview(m.body, 120) };
  }, [replyParentId, messages]);

  const updatesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCount = useRef<number | null>(null);
  useEffect(() => {
    if (prevMessageCount.current === null) {
      prevMessageCount.current = messages.length;
      return;
    }
    if (messages.length > prevMessageCount.current) {
      updatesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    prevMessageCount.current = messages.length;
  }, [messages]);

  const fresh =
    summary.freshness_minutes != null
      ? summary.freshness_minutes < 120
        ? `${summary.freshness_minutes} min ago`
        : `${Math.round(summary.freshness_minutes / 60)} h ago`
      : "unknown";

  const tabDefs = useMemo(
    () =>
      [
        { id: "tracking" as const, label: "Tracking", shortLabel: "Tracking", icon: Route },
        { id: "map" as const, label: "Map", shortLabel: "Map", icon: MapIcon },
        { id: "messages" as const, label: "Messages", shortLabel: "Messages", icon: MessageSquare, count: messages.length },
        { id: "documents" as const, label: "Documents", shortLabel: "Documents", icon: FileText },
      ],
    [messages.length],
  );

  return (
    <div className="min-h-dvh bg-linear-to-b from-zinc-100/90 via-zinc-50/50 to-zinc-100/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
          <div className="border-b border-zinc-100 bg-linear-to-br from-white via-zinc-50/80 to-sky-50/30 px-5 py-6 sm:px-8 sm:py-8 dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-sky-950/20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              {organization?.name ?? "Shipment report"}
            </p>
            <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
              {report.title ?? `Container ${summary.container_number}`}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${riskInsightBadgeClass(insights.risk_level)}`}
              >
                {insights.risk_level.toUpperCase()} risk
              </span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Carrier data · {fresh}</span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {insights.headline}
            </p>
          </div>

          <div className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
            <div
              role="tablist"
              aria-label="Report sections"
              className="flex w-full flex-col gap-2 rounded-xl bg-zinc-100/90 p-2 sm:flex-row dark:bg-zinc-900/80"
            >
              {tabDefs.map(({ id, label, shortLabel, icon: Icon, count }) => {
                const selected = dashboardTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    id={`report-tab-${id}`}
                    aria-controls={`report-panel-${id}`}
                    onClick={() => setDashboardTab(id)}
                    className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors sm:justify-center ${
                      selected
                        ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                        : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                    {count !== undefined && count > 0 ? (
                      <span
                        className={`ml-0.5 inline-flex min-w-5 justify-center rounded-full px-1.5 py-0 text-[11px] font-semibold tabular-nums ${
                          selected
                            ? "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100"
                            : "bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          {dashboardTab === "tracking" ? (
            <div
              role="tabpanel"
              id="report-panel-tracking"
              aria-labelledby="report-tab-tracking"
              className="flex flex-col gap-6"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Container
                  </p>
                  <p className="mt-2 font-mono text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {summary.container_number}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Carrier
                  </p>
                  <p className="mt-2 text-base font-medium text-zinc-900 dark:text-zinc-50">
                    {summary.carrier ?? "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Tracking sync
                  </p>
                  <div className="mt-2">
                    <TrackingWorkflowStatusPill status={summary.tracking_request_status} />
                  </div>
                </div>
                <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Reported status
                  </p>
                  <div className="mt-2">
                    <CarrierReportedStatusPill status={summary.status} />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Last known location</h2>
                <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {summary.last_known_location != null ? String(summary.last_known_location) : "—"}
                </p>
              </div>

              <ShipmentDetailsPanel
                location={summary.shipment_context}
                title="Shipment details"
                subtitle="Latest carrier-reported facts for this container."
                className="border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              />

              <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <ContainerTimeline
                  events={timeline}
                  interactiveDetail={false}
                  className="rounded-none border-0 shadow-none"
                />
              </div>

              {alerts.length > 0 ? (
                <section className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <h2 className="mb-3 text-sm font-semibold text-amber-950 dark:text-amber-100">Alerts</h2>
                  <ul className="flex flex-col gap-2 text-sm">
                    {alerts.map((a) => (
                      <li
                        key={a.id}
                        className="rounded-lg border border-amber-200/60 bg-white/80 px-3 py-2 dark:border-amber-900/40 dark:bg-zinc-950/40"
                      >
                        <span className="font-medium text-amber-950 dark:text-amber-100">{a.severity}</span>
                        <span className="text-amber-800/80 dark:text-amber-200/80"> · {a.alert_type}</span>
                        <p className="text-zinc-800 dark:text-zinc-200">{a.message}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {payload.raw_external ? (
                <section className="rounded-xl border border-zinc-200/90 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/50">
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
            </div>
          ) : null}

          {dashboardTab === "map" ? (
            <div
              role="tabpanel"
              id="report-panel-map"
              aria-labelledby="report-tab-map"
              className="flex flex-col gap-4"
            >
              <div className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-5">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" id="public-report-map-heading">
                  Shipment map
                </h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Carrier-reported places and coordinates from this report (same data as shipment details).
                </p>
                <div className="mt-4">
                  <ShipmentTrackingMapPanel
                    location={summary.shipment_context}
                    headingId="public-report-map-heading"
                  />
                </div>
              </div>
            </div>
          ) : null}

          {dashboardTab === "messages" ? (
            <div
              role="tabpanel"
              id="report-panel-messages"
              aria-labelledby="report-tab-messages"
              className="rounded-xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
            >
              <div className="mb-6 flex flex-col gap-1 border-b border-zinc-100 pb-5 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Messages</h2>
                </div>
              </div>
              <div className="mb-8">
                <ul className="flex flex-col gap-8">
                  {messages.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
                      No messages yet.
                    </li>
                  ) : (
                    messageTree.map((n) => (
                      <PublicThreadItem
                        key={n.id}
                        node={n}
                        depth={0}
                        replyTargetId={replyParentId}
                        onReply={setReplyParentId}
                        messageById={messageById}
                      />
                    ))
                  )}
                </ul>
                <div ref={updatesEndRef} className="h-1 shrink-0 scroll-mt-4" aria-hidden />
              </div>
              <form
                onSubmit={onSubmit}
                className="flex flex-col gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800"
              >
                {replyPreview ? (
                  <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/50">
                    <div className="min-w-0 border-l-[3px] border-sky-400/90 pl-3 dark:border-sky-500/70">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Replying to {replyPreview.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                        {replyPreview.excerpt}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyParentId(null)}
                      className="shrink-0 text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline dark:hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
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
                  <div className="mt-1 rounded-xl bg-sky-50/90 px-5 py-4 text-sm shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:ring-2 focus-within:ring-sky-400/40 dark:bg-sky-950/28 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] dark:focus-within:ring-sky-500/35">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">{name.trim() || "You"}</span>
                    </div>
                    <AutoGrowTextarea
                      required
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      maxLength={4000}
                      className="mt-3 w-full border-0 bg-transparent p-0 text-sm leading-relaxed text-zinc-800 placeholder:text-zinc-400 outline-none ring-0 focus:outline-none dark:text-zinc-200 dark:placeholder:text-zinc-500"
                      placeholder="Ask a question or leave a note for the logistics team."
                      aria-label="Message"
                    />
                  </div>
                </label>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-9 min-w-34 items-center justify-center gap-2 self-start rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
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
            </div>
          ) : null}

          {dashboardTab === "documents" ? (
            <div
              role="tabpanel"
              id="report-panel-documents"
              aria-labelledby="report-tab-documents"
              className="rounded-2xl border border-dashed border-zinc-300/90 bg-white/80 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-950/40 sm:px-10"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                <FileText className="h-7 w-7 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} aria-hidden />
              </div>
              <h2 className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-50">No documents shared yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                When your logistics team adds bills of lading, packing lists, invoices, or other files to this
                shipment, they will show up here for you to view and download.
              </p>
            </div>
          ) : null}
        </div>

        <footer className="mt-10 border-t border-zinc-200/80 pt-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Powered by Containerly · Carrier data is indicative and may change.
        </footer>
      </div>
    </div>
  );
}
