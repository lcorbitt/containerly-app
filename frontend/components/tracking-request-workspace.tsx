"use client";

import Link from "next/link";
import { ArrowRight, MapPin, MessageSquare, Route, Share2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CarrierDetailsModal } from "@/components/carrier-details-modal";
import { DocumentsList } from "@/components/documents-list";
import { PageLoading } from "@/components/page-loading";
import { ShareLinkRowActions } from "@/components/share-link-row-actions";
import { createClient } from "@/lib/supabase/client";
import { useOrganizationWorkspace } from "@/contexts/organization-workspace";
import { useToast } from "@/contexts/toast";
import { ContainerTimeline, formatTimelineWhen } from "@/components/container-timeline";
import {
  CarrierReportedStatusPill,
  ShareLinkStatePill,
  TrackingWorkflowStatusPill,
} from "@/components/status-pills";
import { computePublicReportInsights, riskInsightBadgeClass } from "@/lib/report-insights";
import { getShipmentDetailRows, shipperReceiverFromLocation } from "@/lib/jsoncargo-display";
import type { ReportActivity, ReportMessage, SharedReport, TrackingRequest } from "@/types/database";
import type { PublicTimelineEvent } from "@/types/public-report";

const PRIMARY_BTN =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900";

/** Below ~xl: cap panel height so long lists scroll inside */
const PANEL_FIXED_H = "min-h-[min(520px,calc(100dvh-14rem))] max-h-[min(720px,calc(100dvh-12rem))]";

type MainTab = "timeline" | "thread" | "report";

function PostSpinner() {
  return (
    <span
      className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

function tabButtonClass(active: boolean) {
  return `inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
  }`;
}

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  public_view: "Public report viewed",
  customer_message: "Customer message on report",
};

function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

/** Resolves `shared_report_id` for display (title vs removed; short id disambiguates links). */
function activityLinkParts(
  sharedReportId: string | null,
  shareById: Map<string, SharedReport>,
): { primary: string } | null {
  if (!sharedReportId) return null;
  const share = shareById.get(sharedReportId);
  if (share) {
    const primary = share.title?.trim() || "Untitled link";
    return { primary };
  }
  return { primary: "Link removed from workspace" };
}

function ActivityList({
  activity,
  shareById,
  className,
}: {
  activity: ReportActivity[];
  shareById: Map<string, SharedReport>;
  className?: string;
}) {
  return (
    <ul className={`space-y-0 text-xs text-zinc-600 dark:text-zinc-400 ${className ?? ""}`}>
      {activity.length === 0 ? (
        <li className="py-2 text-zinc-500">No activity logged yet.</li>
      ) : (
        activity.map((a) => {
          const linkParts = activityLinkParts(a.shared_report_id, shareById);
          return (
            <li
              key={a.id}
              className="border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800"
            >
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {activityActionLabel(a.action)}
                </span>
                <span className="text-zinc-500"> · {new Date(a.created_at).toLocaleString()}</span>
              </div>
              {linkParts ? (
                <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-600 dark:text-zinc-300">{linkParts.primary}</span>
                </p>
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );
}

function LinksPanel({
  title,
  onTitleChange,
  creating,
  onCreateShare,
  shares,
  origin,
  onDeleteShare,
  onToast,
}: {
  title: string;
  onTitleChange: (value: string) => void;
  creating: boolean;
  onCreateShare: () => void;
  shares: SharedReport[];
  origin: string;
  onDeleteShare: (id: string) => Promise<void>;
  onToast: (message: string, variant: "success" | "error" | "info") => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-zinc-100 p-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-500">
          Share a customer-safe URL (status, timeline, non-internal messages). Delete a link when you no
          longer want that URL to work.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            Title (optional)
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="e.g. ACME Corp — March shipment"
            />
          </label>
          <button
            type="button"
            onClick={onCreateShare}
            disabled={creating}
            className={`${PRIMARY_BTN} min-w-[9.25rem] shrink-0`}
          >
            {creating ? (
              <>
                <PostSpinner />
                <span>Creating…</span>
              </>
            ) : (
              <span>Create link</span>
            )}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {shares.length === 0 ? (
          <p className="text-sm text-zinc-500">No share links yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {shares.map((s) => {
              const url = `${origin}/report/${s.id}`;
              const active = !s.revoked_at;
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-100 p-3 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs break-all text-zinc-700 dark:text-zinc-300">{url}</p>
                    <p className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      {!active ? <ShareLinkStatePill active={false} /> : null}
                      {s.title ? <span className="text-zinc-600 dark:text-zinc-400">{s.title}</span> : null}
                    </p>
                  </div>
                  <ShareLinkRowActions shareId={s.id} url={url} onDelete={onDeleteShare} onToast={onToast} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ThreadPanel({
  messages,
  body,
  onBodyChange,
  internalOnly,
  onInternalOnlyChange,
  posting,
  onPostMessage,
}: {
  messages: ReportMessage[];
  body: string;
  onBodyChange: (value: string) => void;
  internalOnly: boolean;
  onInternalOnlyChange: (value: boolean) => void;
  posting: boolean;
  onPostMessage: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-zinc-500">No messages yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  m.is_internal
                    ? "border-amber-200/80 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20"
                    : "border-zinc-100 dark:border-zinc-800"
                }`}
              >
                <span className="text-xs text-zinc-500">
                  {m.author_kind}
                  {m.is_internal ? " · internal" : " · customer-visible"}
                  {" · "}
                  {new Date(m.created_at).toLocaleString()}
                </span>
                <p className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 space-y-2 border-t border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input
            type="checkbox"
            checked={internalOnly}
            onChange={(e) => onInternalOnlyChange(e.target.checked)}
          />
          Internal note (hidden on public report)
        </label>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="Update your team or the customer…"
        />
        <button
          type="button"
          onClick={onPostMessage}
          disabled={posting || !body.trim()}
          className={`${PRIMARY_BTN} min-w-[6.5rem]`}
        >
          {posting ? (
            <>
              <PostSpinner />
              <span>Posting…</span>
            </>
          ) : (
            <span>Post</span>
          )}
        </button>
      </div>
    </div>
  );
}

type ContainerSnapshot = {
  status: string | null;
  carrier: string | null;
  location: Record<string, unknown> | null;
  last_synced_at: string | null;
};

export function TrackingRequestWorkspace({ requestId }: { requestId: string }) {
  const { toast } = useToast();
  const { selectedOrgId } = useOrganizationWorkspace();
  const [request, setRequest] = useState<TrackingRequest | null>(null);
  const [shares, setShares] = useState<SharedReport[]>([]);
  const [messages, setMessages] = useState<ReportMessage[]>([]);
  const [activity, setActivity] = useState<ReportActivity[]>([]);
  const [timeline, setTimeline] = useState<PublicTimelineEvent[]>([]);
  const [containerRow, setContainerRow] = useState<ContainerSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [posting, setPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("timeline");
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      const quiet = opts?.quiet ?? false;
      if (!selectedOrgId) return;
      setLoadError(null);
      if (!quiet) setLoading(true);
      try {
        const supabase = createClient();
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) {
          setContainerRow(null);
          setLoadError("Not signed in");
          return;
        }

        const { data: tr, error: trErr } = await supabase
          .from("tracking_requests")
          .select("*")
          .eq("id", requestId)
          .eq("organization_id", selectedOrgId)
          .maybeSingle();

        if (trErr) {
          setContainerRow(null);
          setLoadError(trErr.message);
          return;
        }
        if (!tr) {
          setRequest(null);
          setContainerRow(null);
          setLoadError("Tracking request not found for this workspace.");
          return;
        }
        setRequest(tr as TrackingRequest);

        const trRow = tr as TrackingRequest;
        const containerId = trRow.container_id;

        const [
          { data: sh },
          { data: msg },
          { data: act },
          { data: tev },
          containerResult,
        ] = await Promise.all([
          supabase
            .from("shared_reports")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: false }),
          supabase
            .from("report_messages")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: true }),
          supabase
            .from("report_activity")
            .select("*")
            .eq("tracking_request_id", requestId)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("tracking_events")
            .select(
              "id, event_type, status, location, occurred_at, created_at, container_id, tracking_request_id, raw_payload",
            )
            .eq("tracking_request_id", requestId)
            .order("occurred_at", { ascending: false })
            .limit(100),
          containerId
            ? supabase
                .from("containers")
                .select("status, carrier, location, last_synced_at")
                .eq("id", containerId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        setShares((sh as SharedReport[]) ?? []);
        setMessages((msg as ReportMessage[]) ?? []);
        setActivity((act as ReportActivity[]) ?? []);
        setTimeline([...(tev as PublicTimelineEvent[] | null) ?? []]);
        setContainerRow((containerResult.data as ContainerSnapshot | null) ?? null);
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [requestId, selectedOrgId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const shareById = useMemo(() => new Map(shares.map((s) => [s.id, s])), [shares]);
  const shipmentLoc = (containerRow?.location as Record<string, unknown> | null) ?? null;
  const carrierDetailRows = useMemo(() => getShipmentDetailRows(shipmentLoc), [shipmentLoc]);
  const shipperReceiver = useMemo(() => shipperReceiverFromLocation(shipmentLoc), [shipmentLoc]);
  const billOfLading = useMemo(() => {
    if (!shipmentLoc || typeof shipmentLoc !== "object") return "";
    const v = (shipmentLoc as Record<string, unknown>).bill_of_lading;
    return typeof v === "string" ? v.trim() : v != null ? String(v).trim() : "";
  }, [shipmentLoc]);
  const latestTimelineIso = timeline.length ? timeline[0]!.occurred_at : null;

  const requestSummaryData = useMemo(() => {
    if (!request) return null;
    const carrierReportedStatus = containerRow?.status ?? request.status;
    const lastSyncedAt = containerRow?.last_synced_at ?? request.last_sync_at;
    const insights = computePublicReportInsights({ carrierReportedStatus, lastSyncedAt });
    const loc = containerRow?.location;
    const lastKnown =
      loc && typeof loc === "object"
        ? ((loc as Record<string, unknown>).last_location ??
            (loc as Record<string, unknown>).discharging_port ??
            (loc as Record<string, unknown>).loading_port ??
            null)
        : null;
    const freshText =
      insights.freshness_minutes != null
        ? insights.freshness_minutes < 120
          ? `${insights.freshness_minutes} min ago`
          : `${Math.round(insights.freshness_minutes / 60)} h ago`
        : "unknown";
    return { insights, lastKnown, freshText, carrier: containerRow?.carrier ?? null };
  }, [request, containerRow]);

  async function createShare() {
    if (!selectedOrgId || !request) return;
    setCreating(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("shared_reports").insert({
        organization_id: selectedOrgId,
        tracking_request_id: requestId,
        created_by: u.user.id,
        title: title.trim() || null,
        settings: { include_raw_external: false, include_alerts: true },
      });
      if (error) throw new Error(error.message);
      setTitle("");
      await load({ quiet: true });
      toast("Customer report link created", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create link", "error");
    } finally {
      setCreating(false);
    }
  }

  async function deleteShareRow(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from("shared_reports").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await load({ quiet: true });
  }

  async function postMessage() {
    const t = body.trim();
    if (!t) return;
    setPosting(true);
    try {
      const supabase = createClient();
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { error } = await supabase.from("report_messages").insert({
        tracking_request_id: requestId,
        author_user_id: u.user.id,
        author_kind: "member",
        is_internal: internalOnly,
        body: t,
      });
      if (error) throw new Error(error.message);
      setBody("");
      await load({ quiet: true });
      toast(internalOnly ? "Internal note posted" : "Message posted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not post message", "error");
    } finally {
      setPosting(false);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (!selectedOrgId) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this request.
      </p>
    );
  }

  if (loadError && !request) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <Link href="/requests" className="mt-4 inline-block text-sm font-medium underline">
          Back to requests
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[min(420px,55dvh)] w-full max-w-6xl flex-col px-4 py-4 md:py-5">
        <PageLoading loadingText="Loading request…" />
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const headerJumpClass =
    "text-xs font-medium text-zinc-600 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200";

  const lastSyncLabel =
    request.last_sync_at != null
      ? formatTimelineWhen(request.last_sync_at)
      : containerRow?.last_synced_at != null
        ? formatTimelineWhen(containerRow.last_synced_at)
        : null;

  const carrierLastSyncedDisplay =
    containerRow?.last_synced_at != null
      ? new Date(containerRow.last_synced_at).toLocaleString()
      : request.last_sync_at != null
        ? new Date(request.last_sync_at).toLocaleString()
        : null;

  const carrierLastKnownDisplay =
    requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-4 md:py-5">
      <header className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-100 px-4 py-4 sm:px-5 dark:border-zinc-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Container
              </p>
              <h1 className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                #{request.container_number}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <TrackingWorkflowStatusPill status={request.status} />
                {requestSummaryData ? (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskInsightBadgeClass(requestSummaryData.insights.risk_level)}`}
                  >
                    {requestSummaryData.insights.risk_level.toUpperCase()} risk
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:items-end">
              <div className="flex min-w-0 max-w-full flex-nowrap items-center gap-2 text-sm font-medium sm:max-w-2xl sm:justify-end">
                <MapPin className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                {shipperReceiver.shipper || shipperReceiver.receiver ? (
                  <>
                    <span className="min-w-0 flex-1 truncate text-zinc-800 sm:text-right dark:text-zinc-200">
                      {shipperReceiver.shipper ?? "—"}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={2} aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-zinc-800 sm:text-right dark:text-zinc-200">
                      {shipperReceiver.receiver ?? "—"}
                    </span>
                  </>
                ) : requestSummaryData?.lastKnown != null ? (
                  <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">
                    {String(requestSummaryData.lastKnown)}
                  </span>
                ) : (
                  <span className="text-zinc-500 dark:text-zinc-400">Route not available yet</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5 sm:items-end">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Last updated {lastSyncLabel ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-h-0 min-w-0 flex-col lg:min-h-[min(720px,calc(100dvh-12rem))]">
          <div
            className="flex shrink-0 gap-0 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800"
            role="tablist"
            aria-label="Request workspace"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "timeline"}
              className={tabButtonClass(mainTab === "timeline")}
              onClick={() => setMainTab("timeline")}
            >
              <Route className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Timeline
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "thread"}
              className={tabButtonClass(mainTab === "thread")}
              onClick={() => setMainTab("thread")}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Messages
              <span className="tabular-nums text-zinc-400">({messages.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "report"}
              className={tabButtonClass(mainTab === "report")}
              onClick={() => setMainTab("report")}
            >
              <Share2 className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Customer Reports
              <span className="tabular-nums text-zinc-400">({shares.length})</span>
            </button>
          </div>
          <div
            className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-xl rounded-t-none border border-t-0 border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${PANEL_FIXED_H}`}
            role="tabpanel"
          >
            {mainTab === "timeline" ? (
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                <ContainerTimeline
                  events={timeline}
                  hideHeader
                  className="rounded-lg border-zinc-200 dark:border-zinc-800"
                />
              </div>
            ) : null}
            {mainTab === "thread" ? (
              <ThreadPanel
                messages={messages}
                body={body}
                onBodyChange={setBody}
                internalOnly={internalOnly}
                onInternalOnlyChange={setInternalOnly}
                posting={posting}
                onPostMessage={() => void postMessage()}
              />
            ) : null}
            {mainTab === "report" ? (
              <LinksPanel
                title={title}
                onTitleChange={setTitle}
                creating={creating}
                onCreateShare={() => void createShare()}
                shares={shares}
                origin={origin}
                onDeleteShare={deleteShareRow}
                onToast={toast}
              />
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Container Details</h2>
            </div>
            <dl className="space-y-3 px-4 py-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier
                </dt>
                <dd className="mt-1">
                  <button
                    type="button"
                    onClick={() => setCarrierModalOpen(true)}
                    className="text-left text-sm font-medium text-blue-700 transition-colors hover:text-blue-800 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-blue-400 dark:hover:text-blue-300 dark:focus-visible:ring-offset-zinc-950"
                    aria-haspopup="dialog"
                    aria-expanded={carrierModalOpen}
                    aria-label="Open carrier details"
                  >
                    {requestSummaryData?.carrier?.trim() || "View carrier details"}
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier status
                </dt>
                <dd className="mt-1">
                  <CarrierReportedStatusPill status={containerRow?.status ?? request.status} />
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Last known location
                </dt>
                <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {requestSummaryData?.lastKnown != null ? String(requestSummaryData.lastKnown) : "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 lg:max-h-[min(720px,calc(100dvh-12rem))]">
            <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
              <ActivityList activity={activity} shareById={shareById} />
            </div>
          </div>

          <DocumentsList billOfLading={billOfLading || undefined} />
        </aside>
      </div>

      <CarrierDetailsModal
        open={carrierModalOpen}
        onClose={() => setCarrierModalOpen(false)}
        carrierName={requestSummaryData?.carrier?.trim() ? requestSummaryData.carrier.trim() : null}
        reportedStatus={containerRow?.status ?? request.status}
        lastKnownDisplay={carrierLastKnownDisplay}
        lastSyncedAtDisplay={carrierLastSyncedDisplay}
        detailRows={carrierDetailRows}
      />
    </div>
  );
}
