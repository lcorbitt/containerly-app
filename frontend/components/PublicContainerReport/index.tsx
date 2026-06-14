"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { CUSTOMER_SIDE_NAV_SETTINGS_HREF } from "@/app/(customer)/components/CustomerSideNav/constants";
import type { SuggestedShipmentAction } from "@shared/dto/performance.dto";
import {
  messageTemplateForAction,
  shipmentActionAudienceFromPortalViewer,
  shipmentActionTabForHandler,
} from "@/utils/shipment-actions";
import { hasShipmentDraftDocuments } from "@/utils/workspace-tab-counts";
import type { PortalDetailsTabId } from "./PortalDetailsTabs/types";
import { ShipmentDocumentUploadModal } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentWorkspaceScopePanel/ShipmentDocumentUploadZone/ShipmentDocumentUploadModal";
import { ShipmentMailTrackingPanel } from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentMailTrackingPanel";
import { ThreadPanel } from "@/components/WorkspaceThreadPanel";
import {
  ShipmentThreadStartBanner,
  SHIPMENT_THREAD_EMPTY_STATE_TEXT,
} from "@/components/WorkspaceThreadPanel/ShipmentThreadStartBanner";
import {
  SHIPMENT_MESSAGES_PANEL_SHELL_CLASS,
  SHIPMENT_MESSAGES_THREAD_SHELL_CLASS,
} from "@/app/(authenticated)/shipments/[shipmentId]/components/ShipmentMessagesPanel/constants";
import { createClient } from "@/lib/supabase/client";
import { getOrgImagePublicUrl } from "@/utils/org-image";
import type { PublicReportPayload } from "@/types/public-report";
import { BrandedHeader } from "@/components/BrandedHeader";
import { useNavigationProgress } from "@/components/NavigationProgress";
import { PortalDocumentsPanel } from "./PortalDocumentsPanel";
import { PortalCommercialDetailsSection } from "./PortalCommercialDetailsSection";
import { PortalSuggestedActionsCard } from "./PortalSuggestedActionsCard";
import { PortalDetailsTabs } from "./PortalDetailsTabs";
import { PortalTimelinePanel } from "./PortalTimelinePanel";
import {
  PORTAL_COMMERCIAL_CARD_CLASS,
  PORTAL_CUSTOMER_NOTE_CLASS,
  PORTAL_PROFILE_SETUP_BANNER_ACTIONS_CLASS,
  PORTAL_PROFILE_SETUP_BANNER_CLASS,
  PORTAL_PROFILE_SETUP_BANNER_TEXT_CLASS,
  PORTAL_PROFILE_SETUP_CONFIGURE_LATER_CLASS,
  PORTAL_PROFILE_SETUP_CONFIGURE_LATER_LABEL,
  PORTAL_PROFILE_SETUP_CONFIGURE_NOW_CLASS,
  PORTAL_PROFILE_SETUP_CONFIGURE_NOW_LABEL,
  PORTAL_PROFILE_SETUP_SAVING_LABEL,
  PORTAL_STATUS_STRIP_CLASS,
} from "./constants";
import { usePublicContainerReport } from "./usePublicContainerReport";
import { WORKSPACE_TABS_SECTION_CLASS } from "@/components/WorkspaceTabShell/constants";
import { SITE_URL } from "@/lib/site-metadata";
import { isShipmentDocumentsApproved } from "@/utils/shipment-workflow-status";

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
    tabCounts,
    setupDismissBusy,
    currentUserId,
    messageAuthorByUserId,
    messageAuthorEmailByUserId,
    authorAvatarUrlByUserId,
    attachmentsByMessageId,
    postMessage,
    deleteMessage,
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
    openAttachment,
    handleSetupDismiss,
    handleDocumentOpen,
    commercialDetails,
    reviewBusyId,
    rejectReasonById,
    setRejectReasonById,
    handleDocumentReview,
    showDocumentScopeLabels,
    refresh,
    documentsUploadEnabled,
    uploadModalOpen,
    setUploadModalOpen,
    documentType,
    setDocumentType,
    documentGroup,
    setDocumentGroup,
    uploadingDocuments,
    uploadDocuments,
  } = usePublicContainerReport({ shipmentId, initial, readOnlyMessaging });

  const { startNavigation } = useNavigationProgress();

  const suggestedActionAudience = useMemo(
    () => shipmentActionAudienceFromPortalViewer(payload.viewer),
    [payload.viewer],
  );

  const hasDraftDocuments = useMemo(() => hasShipmentDraftDocuments(attachments), [attachments]);

  const suggestionContext = useMemo(
    () => ({
      workflowStatus: commercialDetails?.workflow_status,
      hasDraftDocuments,
    }),
    [commercialDetails?.workflow_status, hasDraftDocuments],
  );

  const handleSuggestedAction = useCallback(
    (action: SuggestedShipmentAction) => {
      const tab = shipmentActionTabForHandler(
        action.handler_key as Parameters<typeof shipmentActionTabForHandler>[0],
      );
      if (tab) setDashboardTab(tab as PortalDetailsTabId);

      const template = messageTemplateForAction(action.id);
      if (template) {
        setReplyParentId(null);
        setBody(template);
      }
    },
    [setBody, setDashboardTab, setReplyParentId],
  );

  const handlePortalDocumentUpload = useCallback(
    async (files: File[]) => {
      const ok = await uploadDocuments(files);
      if (ok) setUploadModalOpen(false);
    },
    [uploadDocuments, setUploadModalOpen],
  );

  const orgLogoUrl = organization?.org_image_path
    ? getOrgImagePublicUrl(createClient(), organization.org_image_path)
    : null;

  const documentsApproved = isShipmentDocumentsApproved(commercialDetails?.workflow_status);
  const mailTrackingPanel = organization?.id ? (
    <ShipmentMailTrackingPanel
      shipmentId={shipmentId}
      organizationId={organization.id}
      initialTrackingNumber={commercialDetails?.physical_mail_tracking_number}
      enabled={documentsApproved}
      readOnly={payload.viewer === "importer" || threadReadOnly}
      variant="inline"
      onSaved={() => void refresh()}
    />
  ) : null;

  return (
    <div className="min-h-dvh bg-linear-to-b from-zinc-100/90 via-zinc-50/50 to-zinc-100/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900/80">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
        <div className="flex flex-col gap-6">
          {!threadReadOnly &&
          payload.shipment_access &&
          !payload.shipment_access.profile_completed_at &&
          payload.shipment_access.configuration_reminder_due_at ? (
            <div className={PORTAL_PROFILE_SETUP_BANNER_CLASS}>
              <p className={PORTAL_PROFILE_SETUP_BANNER_TEXT_CLASS}>
                You&apos;re in. You can add your display name and other preferences later — we&apos;ll remind you
                until{" "}
                {new Date(payload.shipment_access.configuration_reminder_due_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                .
              </p>
              <div className={PORTAL_PROFILE_SETUP_BANNER_ACTIONS_CLASS}>
                <Link
                  href={CUSTOMER_SIDE_NAV_SETTINGS_HREF}
                  className={PORTAL_PROFILE_SETUP_CONFIGURE_NOW_CLASS}
                  onClick={() => startNavigation({ label: "Settings" })}
                >
                  {PORTAL_PROFILE_SETUP_CONFIGURE_NOW_LABEL}
                </Link>
                <button
                  type="button"
                  disabled={setupDismissBusy}
                  onClick={handleSetupDismiss}
                  className={PORTAL_PROFILE_SETUP_CONFIGURE_LATER_CLASS}
                >
                  {setupDismissBusy
                    ? PORTAL_PROFILE_SETUP_SAVING_LABEL
                    : PORTAL_PROFILE_SETUP_CONFIGURE_LATER_LABEL}
                </button>
              </div>
            </div>
          ) : null}

          <PortalSuggestedActionsCard
            audience={suggestedActionAudience}
            suggestionContext={suggestionContext}
            onAction={handleSuggestedAction}
          />

          <header className={PORTAL_COMMERCIAL_CARD_CLASS}>
            <BrandedHeader
              variant="embedded"
              organizationName={organization?.name ?? "Shipment report"}
              organizationImageUrl={orgLogoUrl}
              actions={headerActions}
            />

            <PortalCommercialDetailsSection
              commercialDetails={commercialDetails}
              summary={summary}
              shipmentId={shipmentId}
              organizationId={organization?.id}
              viewer={payload.viewer}
              riskLevel={insights.risk_level}
              riskMessage={summary.customer_note}
              onRiskSaved={refresh}
            />

            <div className={PORTAL_STATUS_STRIP_CLASS}>
              {summary.customer_note?.trim() ? (
                <p className={PORTAL_CUSTOMER_NOTE_CLASS}>{summary.customer_note.trim()}</p>
              ) : null}
            </div>
          </header>

          <section className={WORKSPACE_TABS_SECTION_CLASS}>
            <PortalDetailsTabs
              activeTab={dashboardTab}
              onTabChange={setDashboardTab}
              tabCounts={tabCounts}
              timelinePanel={
                <PortalTimelinePanel shipmentId={shipmentId} payload={payload} />
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
                  showUpload={documentsUploadEnabled}
                  uploading={uploadingDocuments}
                  onAddDocumentsClick={() => setUploadModalOpen(true)}
                  mailTrackingPanel={mailTrackingPanel}
                />
              }
              messagesPanel={
                <section aria-label="Shipment messages" className={SHIPMENT_MESSAGES_PANEL_SHELL_CLASS}>
                  {threadReadOnly ? (
                    <p className="border-b border-zinc-100 px-5 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      Messaging is read-only in this preview.
                    </p>
                  ) : null}
                  <div className={SHIPMENT_MESSAGES_THREAD_SHELL_CLASS}>
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
                      posting={sending}
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
                      allowMessageDelete={!threadReadOnly}
                      allowMessageEdit={!threadReadOnly}
                      composerHidden={threadReadOnly}
                      allowReply={!threadReadOnly}
                      emptyStateText={SHIPMENT_THREAD_EMPTY_STATE_TEXT}
                      threadStartBanner={<ShipmentThreadStartBanner shipmentLabel={shipmentLabel} />}
                    />
                  </div>
                </section>
              }
            />
          </section>

          <ShipmentDocumentUploadModal
            open={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            documentType={documentType}
            onDocumentTypeChange={setDocumentType}
            documentGroup={documentGroup}
            onDocumentGroupChange={setDocumentGroup}
            uploading={uploadingDocuments}
            onUpload={handlePortalDocumentUpload}
          />
        </div>

        <footer className="mt-10 border-t border-zinc-200/80 pt-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Powered by{" "}
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
          >
            Containerly
          </a>
        </footer>
      </div>
    </div>
  );
}
