"use client";

import { useMemo } from "react";
import { ThreadPanel } from "@/components/WorkspaceThreadPanel";
import { SHIPMENT_MESSAGES_THREAD_SHELL_CLASS } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentMessagesPanel/constants";
import { createClient } from "@/lib/supabase/client";
import { getOrgImagePublicUrl } from "@/utils/org-image";
import { riskInsightBadgeClass } from "@/utils/report-insights";
import type { PublicReportPayload } from "@/types/public-report";
import { BrandedHeader } from "@/components/BrandedHeader";
import { PortalDocumentsPanel } from "./PortalDocumentsPanel";
import { PortalCommercialDetailsSection } from "./PortalCommercialDetailsSection";
import { PortalDetailsTabs } from "./PortalDetailsTabs";
import { PortalTrackingPanel } from "./PortalTrackingPanel";
import {
  PORTAL_COMMERCIAL_CARD_CLASS,
  PORTAL_MESSAGES_SHELL_CLASS,
  PORTAL_STATUS_STRIP_CLASS,
} from "./constants";
import { usePublicContainerReport } from "./hooks/usePublicContainerReport";
import { WORKSPACE_TABS_SECTION_CLASS } from "@/components/WorkspaceTabShell/constants";

export function PublicContainerReport({
  shipmentId,
  initial,
  readOnlyMessaging = false,
  headerActions,
}: {
  shipmentId: string;
  initial: PublicReportPayload;
  readOnlyMessaging?: boolean;
  headerActions?: React.ReactNode;
}) {
  const {
    payload,
    organization,
    summary,
    insights,
    attachments,
    containerLines,
    logisticsHints,

    fresh,
    threadReadOnly,
    threadMessages,
    shipmentLabel,
    body,
    setBody,
    replyParentId,
    setReplyParentId,
    sending,
    dashboardTab,
    setDashboardTab,
    setupDismissBusy,
    currentUserId,
    composerAuthorLabel,
    messageAuthorByUserId,
    attachmentsByMessageId,
    postMessage,
    handleSetupDismiss,
    handleDocumentOpen,
    commercialDetails,
    hasTracking,
    reviewBusyId,
    rejectReasonById,
    setRejectReasonById,
    handleDocumentReview,
    showDocumentScopeLabels,
    refresh,
  } = usePublicContainerReport({ shipmentId, initial, readOnlyMessaging });

  const orgLogoUrl = organization?.org_image_path
    ? getOrgImagePublicUrl(createClient(), organization.org_image_path)
    : null;

  const threadStartBanner = useMemo(() => {
    const audience =
      payload.viewer === "org_member"
        ? "your customer and logistics team"
        : "your logistics team";
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Shipment messages
          {shipmentLabel ? (
            <>
              {" "}
              · Order <span className="font-mono">{shipmentLabel}</span>
            </>
          ) : null}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          This thread is shared with {audience}. Everyone sees the same messages with names and
          timestamps.
        </p>
      </div>
    );
  }, [payload.viewer, shipmentLabel]);

  return (
    <div className="min-h-dvh bg-linear-to-b from-zinc-100/90 via-zinc-50/50 to-zinc-100/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-6">
          <header className={PORTAL_COMMERCIAL_CARD_CLASS}>
            <BrandedHeader
              variant="embedded"
              organizationName={organization?.name ?? "Shipment report"}
              organizationImageUrl={orgLogoUrl}
              actions={headerActions}
            />

            <PortalCommercialDetailsSection commercialDetails={commercialDetails} summary={summary} />

            <div className={PORTAL_STATUS_STRIP_CLASS}>
              {hasTracking ? (
                <div className={`flex flex-wrap items-center gap-2${payload.viewer === "org_member" ? " mt-3" : ""}`}>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${riskInsightBadgeClass(insights.risk_level)}`}
                  >
                    {insights.risk_level.toUpperCase()} risk
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Carrier data · {fresh}</span>
                </div>
              ) : null}
              {summary.customer_note?.trim() ? (
                <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-100">
                  {summary.customer_note.trim()}
                </p>
              ) : null}
              {logisticsHints?.note ? (
                <div className="mt-4 rounded-lg border border-amber-200/70 bg-amber-50/70 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/45 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="font-medium">Logistics hint</p>
                  <p className="mt-1 leading-relaxed opacity-95">{logisticsHints.note}</p>
                  {typeof logisticsHints.ais_vs_carrier_eta_hours === "number" ? (
                    <p className="mt-2 text-xs text-amber-900/80 dark:text-amber-200/80">
                      Estimated divergence: {Math.round(Math.abs(logisticsHints.ais_vs_carrier_eta_hours))} hours
                    </p>
                  ) : null}
                </div>
              ) : null}
              {!threadReadOnly &&
              payload.shipment_access &&
              !payload.shipment_access.profile_completed_at &&
              payload.shipment_access.configuration_reminder_due_at ? (
                <div className="mt-4 flex flex-col gap-3 rounded-lg border border-sky-200/90 bg-sky-50/90 px-4 py-3 dark:border-sky-900/60 dark:bg-sky-950/40 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-sky-950 dark:text-sky-100">
                    You&apos;re in. You can add your display name and other preferences later — we&apos;ll remind you
                    until{" "}
                    {new Date(payload.shipment_access.configuration_reminder_due_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    .
                  </p>
                  <button
                    type="button"
                    disabled={setupDismissBusy}
                    onClick={handleSetupDismiss}
                    className="shrink-0 rounded-md bg-sky-800 px-3 py-2 text-xs font-medium text-white hover:bg-sky-900 disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500"
                  >
                    {setupDismissBusy ? "Saving…" : "Configure later"}
                  </button>
                </div>
              ) : null}
            </div>
          </header>

          <section className={WORKSPACE_TABS_SECTION_CLASS}>
            <PortalDetailsTabs
              activeTab={dashboardTab}
              onTabChange={setDashboardTab}
              trackingPanel={
                <PortalTrackingPanel
                  shipmentId={shipmentId}
                  payload={payload}
                  isActive={dashboardTab === "tracking"}
                  onRefresh={refresh}
                />
              }
              documentsPanel={
                <PortalDocumentsPanel
                  attachments={attachments}
                  showScopeLabels={showDocumentScopeLabels}
                  readOnlyReview={threadReadOnly || payload.viewer !== "importer"}
                  reviewBusyId={reviewBusyId}
                  rejectReasonById={rejectReasonById}
                  onRejectReasonChange={(attachmentId, reason) =>
                    setRejectReasonById((prev) => ({ ...prev, [attachmentId]: reason }))
                  }
                  onOpen={handleDocumentOpen}
                  onReview={handleDocumentReview}
                />
              }
              messagesPanel={
                <section
                  aria-label="Shipment messages"
                  className={`${PORTAL_MESSAGES_SHELL_CLASS} min-h-[min(28rem,70vh)]`}
                >
                  {threadReadOnly ? (
                    <p className="border-b border-zinc-100 px-5 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      Messaging is read-only in this preview.
                    </p>
                  ) : null}
                  <div className={SHIPMENT_MESSAGES_THREAD_SHELL_CLASS}>
                    <ThreadPanel
                      messages={threadMessages}
                      authorNameByUserId={messageAuthorByUserId}
                      uploaderDisplayByUserId={messageAuthorByUserId}
                      attachmentsByMessageId={attachmentsByMessageId}
                      onOpenAttachment={(row) => void handleDocumentOpen(row.storage_path)}
                      onRenameAttachment={async () => {}}
                      renamingAttachmentId={null}
                      composerPendingFiles={[]}
                      onComposerPickFiles={() => {}}
                      onRemoveComposerPendingFile={() => {}}
                      body={body}
                      onBodyChange={setBody}
                      internalOnly={false}
                      onInternalOnlyChange={() => {}}
                      showInternalComposerToggle={false}
                      posting={sending}
                      onPostMessage={() => void postMessage()}
                      replyParentId={replyParentId}
                      onReplyParent={setReplyParentId}
                      onClearReplyParent={() => setReplyParentId(null)}
                      currentUserId={currentUserId}
                      onDeleteMessage={() => {}}
                      deletingMessageId={null}
                      composerAuthorLabel={composerAuthorLabel}
                      publicThreadMode
                      allowMessageDelete={false}
                      composerHidden={threadReadOnly}
                      allowReply={!threadReadOnly}
                      emptyStateText="No messages yet. Start the conversation below."
                      threadStartBanner={threadStartBanner}
                    />
                  </div>
                </section>
              }
            />
          </section>
        </div>

        <footer className="mt-10 border-t border-zinc-200/80 pt-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Powered by Containerly · Carrier data is indicative and may change.
        </footer>
      </div>
    </div>
  );
}
