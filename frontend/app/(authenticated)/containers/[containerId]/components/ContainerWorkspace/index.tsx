"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowRight, FileText, Map as MapIcon, MapPin, MessageSquare, Route } from "lucide-react";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { ReportActivityList } from "../ReportActivityList";
import { ContainerDetailsModal } from "../ContainerDetailsModal";
import { VesselEnrichmentCard } from "@/components/VesselEnrichmentCard";
import { ShipmentTrackingMapPanel } from "@/components/ShipmentTrackingMap";
import { DocumentsList } from "@/components/DocumentsList";
import { ThreadPanel } from "@/components/WorkspaceThreadPanel";
import { PageLoading } from "@/components/PageLoading";
import { useNavigationContentGate } from "@/components/NavigationProgress";
import {
  ShipmentTimelineView,
  TimelineOrderToggle,
} from "@/components/ShipmentTimeline";
import { CarrierReportedStatusPill, TrackingWorkflowStatusPill } from "@/components/StatusPills";
import { riskInsightBadgeClass } from "@/utils/report-insights";
import { WORKSPACE_TAB_PANEL_HEIGHT_CSS, workspaceTabButtonClass } from "@/utils/workspace-tab-panel";
import { useContainerWorkspace } from "./hooks/useContainerWorkspace";

function trackingSubviewToggleClass(active: boolean) {
  return `inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
  }`;
}

export function ContainerWorkspace({
  containerId,
  shipmentEmbed,
}: {
  containerId: string;
  /** When set, sibling lines on this shipment switch via callback (shipment page) instead of `/containers/…`. */
  shipmentEmbed?: { onSelectContainer: (containerId: string) => void };
}) {
  const {
    selectedOrgId,
    loading,
    loadError,

    request,
    containerRow,
    bolGroupSiblings,
    timeline,
    timelineOrder,
    activity,
    shipmentLoc,

    mainTab,
    setMainTab,
    trackingSubview,
    setTrackingSubview,

    threadMessages,
    messageAuthorByUserId,
    messageAuthorEmailByUserId,
    authorAvatarUrlByUserId,
    attachmentsByMessageId,
    body,
    setBody,
    posting,
    replyParentId,
    setReplyParentId,
    currentUserId,
    deletingMessageId,
    editingMessageId,
    editDraft,
    setEditDraft,
    startEditMessage,
    cancelEditMessage,
    saveEditMessage,
    savingEditMessageId,
    composerPendingFiles,
    onComposerPickFiles,
    onRemoveComposerPendingFile,
    postMessage,
    deleteMessage,

    docChannel,
    setDocChannel,
    attachmentsNewestFirst,
    uploadingAttachments,
    removingAttachmentId,
    renamingAttachmentId,
    openAttachment,
    pickAttachmentFiles,
    renameAttachment,
    removeAttachment,

    containerDetailsModalOpen,
    setContainerDetailsModalOpen,

    requestSummaryData,
    shipperReceiver,
    carrierDetailRows,
    billOfLading,
    lastSyncLabel,
    carrierLastSyncedDisplay,
    carrierLastKnownDisplay,
  } = useContainerWorkspace({ containerId });

  // Only the standalone /containers/[id] route owns the navigation overlay; when embedded in the
  // shipment page, ShipmentWorkspace already holds the gate, so report ready immediately here.
  const embedded = Boolean(shipmentEmbed);
  const { overlayActive } = useNavigationContentGate(embedded || !loading);

  if (!selectedOrgId) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this request.
      </p>
    );
  }

  if (loadError && !request) {
    return (
      <div className="p-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
        <Link href="/shipments" className="mt-4 inline-block text-sm font-medium underline">
          Back to shipments
        </Link>
      </div>
      </div>
    );
  }

  if (loading) {
    return !embedded && overlayActive ? null : <PageLoading loadingText="Loading request…" />;
  }

  if (!request) {
    return null;
  }

  return (
    <div className="mx-auto box-border flex w-full max-w-6xl flex-col p-6">
      {containerRow?.shipment_id && !shipmentEmbed ? (
        <PageBreadcrumb
          href={`/shipments/${containerRow.shipment_id}`}
          label="Shipment workspace"
          suffix="Container line"
          className="mb-3"
        />
      ) : null}
      <header className="mb-6 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              {shipmentEmbed ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Container line on this shipment</p>
              ) : null}
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Container
              </p>
              <h1 className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                #{request.container_number}
              </h1>
              {request.source_bill_of_lading?.trim() ? (
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Bill of lading</span>{" "}
                  <span className="font-mono">{request.source_bill_of_lading.trim()}</span>
                </p>
              ) : null}
              {bolGroupSiblings.length > 0 ? (
                <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/50">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Other containers on this shipment
                  </p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    {bolGroupSiblings.map((s) => (
                      <li key={s.id}>
                        {shipmentEmbed ? (
                          <button
                            type="button"
                            onClick={() => shipmentEmbed.onSelectContainer(s.id)}
                            className="font-mono text-sm font-medium text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300 dark:decoration-emerald-300/40 dark:hover:decoration-emerald-300"
                          >
                            #{s.container_number}
                          </button>
                        ) : (
                          <Link
                            href={`/containers/${s.id}`}
                            className="font-mono text-sm font-medium text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 hover:decoration-emerald-800 dark:text-emerald-300 dark:decoration-emerald-300/40 dark:hover:decoration-emerald-300"
                          >
                            #{s.container_number}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
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

      <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] lg:grid-rows-1 lg:items-stretch">
        <div className="flex min-w-0 flex-col">
          <div
            className="flex w-full shrink-0 overflow-x-auto"
            role="tablist"
            aria-label="Request workspace"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "timeline"}
              className={workspaceTabButtonClass(mainTab === "timeline")}
              onClick={() => setMainTab("timeline")}
            >
              <Route className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              Tracking
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "thread"}
              className={workspaceTabButtonClass(mainTab === "thread")}
              onClick={() => setMainTab("thread")}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              {shipmentEmbed ? "Container messages" : "Messages"}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mainTab === "documents"}
              className={workspaceTabButtonClass(mainTab === "documents")}
              onClick={() => setMainTab("documents")}
            >
              <FileText className="h-4 w-4 shrink-0 opacity-80" strokeWidth={2} aria-hidden />
              {shipmentEmbed ? "Container files" : "Documents"}
            </button>
          </div>
          <div
            className="flex min-h-0 flex-col overflow-hidden rounded-b-xl rounded-t-none border border-t-none border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
            role="tabpanel"
            style={{ height: WORKSPACE_TAB_PANEL_HEIGHT_CSS }}
          >
            {mainTab === "timeline" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3 py-2.5 sm:px-4 dark:border-zinc-800 dark:bg-zinc-950"
                  role="toolbar"
                  aria-label="Tracking view"
                >
                  <div
                    className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50/90 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/60"
                    role="group"
                    aria-label="Switch timeline or map"
                  >
                    <button
                      type="button"
                      className={trackingSubviewToggleClass(trackingSubview === "timeline")}
                      aria-pressed={trackingSubview === "timeline"}
                      onClick={() => setTrackingSubview("timeline")}
                    >
                      <Route className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
                      Timeline
                    </button>
                    <button
                      type="button"
                      className={trackingSubviewToggleClass(trackingSubview === "map")}
                      aria-pressed={trackingSubview === "map"}
                      onClick={() => setTrackingSubview("map")}
                    >
                      <MapIcon className="h-3.5 w-3.5 opacity-80" strokeWidth={2} aria-hidden />
                      Map
                    </button>
                  </div>
                  {trackingSubview === "timeline" && timelineOrder.displayEvents.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <TimelineOrderToggle
                        newestFirst={timelineOrder.newestFirst}
                        onToggle={timelineOrder.handleOrderToggle}
                      />
                    </div>
                  ) : null}
                </div>
                {trackingSubview === "timeline" ? (
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
                    <ShipmentTimelineView
                      order={timelineOrder}
                      className="shadow-none!"
                    />
                  </div>
                ) : (
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                    <ShipmentTrackingMapPanel location={shipmentLoc} headingId="workspace-map-heading" />
                  </div>
                )}
              </div>
            ) : null}
            {mainTab === "thread" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <ThreadPanel
                  messages={threadMessages}
                  authorNameByUserId={messageAuthorByUserId}
                  authorEmailByUserId={messageAuthorEmailByUserId}
                  authorAvatarUrlByUserId={authorAvatarUrlByUserId}
                  uploaderDisplayByUserId={messageAuthorByUserId}
                  attachmentsByMessageId={attachmentsByMessageId}
                  onOpenAttachment={(row) => void openAttachment(row)}
                  composerPendingFiles={composerPendingFiles}
                  onComposerPickFiles={onComposerPickFiles}
                  onRemoveComposerPendingFile={onRemoveComposerPendingFile}
                  body={body}
                  onBodyChange={setBody}
                  posting={posting}
                  onPostMessage={() => void postMessage()}
                  replyParentId={replyParentId}
                  onReplyParent={setReplyParentId}
                  onClearReplyParent={() => setReplyParentId(null)}
                  currentUserId={currentUserId}
                  onDeleteMessage={(id) => void deleteMessage(id)}
                  onStartEditMessage={startEditMessage}
                  onCancelEditMessage={cancelEditMessage}
                  onSaveEditMessage={(id) => void saveEditMessage(id)}
                  editingMessageId={editingMessageId}
                  editDraft={editDraft}
                  onEditDraftChange={setEditDraft}
                  deletingMessageId={deletingMessageId}
                  savingEditMessageId={savingEditMessageId}
                  emptyStateText={
                    shipmentEmbed
                      ? "No messages on this container yet."
                      : "No messages yet."
                  }
                />
              </div>
            ) : null}
            {mainTab === "documents" ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div
                  className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40"
                  role="tablist"
                  aria-label="Document visibility"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={docChannel === "team"}
                    className={trackingSubviewToggleClass(docChannel === "team")}
                    onClick={() => setDocChannel("team")}
                  >
                    Team files
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={docChannel === "customer"}
                    className={trackingSubviewToggleClass(docChannel === "customer")}
                    onClick={() => setDocChannel("customer")}
                  >
                    Shared with customer
                  </button>
                </div>
                <DocumentsList
                  variant="embedded"
                  billOfLading={billOfLading || undefined}
                  currentUserId={currentUserId}
                  storedFiles={attachmentsNewestFirst.map((a) => ({
                    id: a.id,
                    name: a.file_name,
                    contentType: a.content_type,
                    storagePath: a.storage_path,
                    uploadedByUserId: a.uploaded_by,
                    uploadedByLabel:
                      messageAuthorByUserId[a.uploaded_by]?.trim() || "Unknown user",
                    onOpen: () => void openAttachment(a),
                  }))}
                  onPickFiles={(files) => void pickAttachmentFiles(files)}
                  uploading={uploadingAttachments}
                  onRemoveFile={(id) => void removeAttachment(id)}
                  removingFileId={removingAttachmentId}
                  onRenameFile={(id, name) => renameAttachment(id, name)}
                  renamingFileId={renamingAttachmentId}
                />
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Container Details</h2>
              <button
                type="button"
                onClick={() => setContainerDetailsModalOpen(true)}
                aria-label="Open container details"
                aria-haspopup="dialog"
                aria-expanded={containerDetailsModalOpen}
                className="group inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
              >
                <ArrowUpRight
                  className="h-4 w-4 origin-center text-zinc-500/80 transition-[color,transform] duration-400 ease-in-out group-hover:scale-110 group-hover:text-zinc-900 dark:text-white/80 dark:group-hover:text-white"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>
            <dl className="space-y-4 p-4">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Carrier
                </dt>
                <dd className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {requestSummaryData?.carrier?.trim() || "—"}
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

          {containerRow?.enrichment && Object.keys(containerRow.enrichment).length > 0 ? (
            <VesselEnrichmentCard enrichment={containerRow.enrichment} />
          ) : null}

          <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="shrink-0 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Activity</h2>
            </div>
            <div className="h-40 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 sm:h-44">
              <ReportActivityList activity={activity} />
            </div>
          </div>
        </aside>
      </div>
      </div>

      <ContainerDetailsModal
        open={containerDetailsModalOpen}
        onClose={() => setContainerDetailsModalOpen(false)}
        carrierName={requestSummaryData?.carrier?.trim() ? requestSummaryData.carrier.trim() : null}
        containerNumber={request.container_number}
        reportedStatus={containerRow?.status ?? request.status}
        lastKnownDisplay={carrierLastKnownDisplay}
        lastSyncedAtDisplay={carrierLastSyncedDisplay}
        detailRows={carrierDetailRows}
      />

    </div>
  );
}
