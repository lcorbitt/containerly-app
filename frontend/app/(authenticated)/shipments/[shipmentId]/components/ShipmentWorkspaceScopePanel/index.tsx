"use client";

import { FilePlus2, FileText, Loader2 } from "lucide-react";
import { DOCUMENTS_LIST_ADD_LABEL } from "@/components/DocumentsList/constants";
import { useCallback, useState } from "react";
import { DocumentsList } from "@/components/DocumentsList";
import { ShipmentDocumentUploadModal } from "./ShipmentDocumentUploadZone/ShipmentDocumentUploadModal";
import {
  SHIPMENT_DOCUMENTS_HEADER_CLASS,
  SHIPMENT_DOCUMENTS_HEADER_ICON_CLASS,
  SHIPMENT_DOCUMENTS_HEADER_TITLE,
  SHIPMENT_DOCUMENTS_HEADER_TITLE_CLASS,
  SHIPMENT_DOCUMENTS_HEADER_TITLE_ROW_CLASS,
  SHIPMENT_DOCUMENTS_LIST_SCROLL_CLASS,
  SHIPMENT_DOCUMENTS_LOADING_CONTENT_CLASS,
  SHIPMENT_DOCUMENTS_LOADING_SHELL_CLASS,
  SHIPMENT_DOCUMENTS_LOADING_SPINNER_CLASS,
  SHIPMENT_DOCUMENTS_LOADING_TEXT,
  SHIPMENT_DOCUMENTS_LOADING_TEXT_CLASS,
  SHIPMENT_DOCUMENTS_SECTION_CLASS,
  SHIPMENT_DOCUMENTS_TAB_ACTIONS_CLASS,
  SHIPMENT_DOCUMENTS_UPLOAD_BUTTON_CLASS,
} from "./constants";
import { useShipmentWorkspaceScopePanel } from "./hooks/useShipmentWorkspaceScopePanel";

export function ShipmentWorkspaceScopePanel({
  shipmentId,
  variant = "section",
}: {
  shipmentId: string;
  /** `tab` — embedded under Details/Documents tabs without duplicate chrome. */
  variant?: "section" | "tab";
}) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const {
    selectedOrgId,
    loading,
    loadError,

    documentType,
    setDocumentType,
    documentGroup,
    setDocumentGroup,

    messageAuthorByUserId,
    currentUserId,

    openAttachment,
    uploadAttachmentFiles,
    uploadingAttachments,
    renameAttachment,
    renamingAttachmentId,
    removeAttachment,
    removingAttachmentId,

    attachmentsNewestFirst,
  } = useShipmentWorkspaceScopePanel({ shipmentId });

  const handleUpload = useCallback(
    async (files: File[]) => {
      const ok = await uploadAttachmentFiles(files);
      if (ok) setUploadModalOpen(false);
    },
    [uploadAttachmentFiles],
  );

  const openUploadModal = useCallback(() => setUploadModalOpen(true), []);

  if (!selectedOrgId) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this shipment.
      </p>
    );
  }

  if (loading) {
    return (
      <div
        className={SHIPMENT_DOCUMENTS_LOADING_SHELL_CLASS}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className={SHIPMENT_DOCUMENTS_LOADING_CONTENT_CLASS}>
          <Loader2 className={SHIPMENT_DOCUMENTS_LOADING_SPINNER_CLASS} aria-hidden />
          <p className={SHIPMENT_DOCUMENTS_LOADING_TEXT_CLASS}>{SHIPMENT_DOCUMENTS_LOADING_TEXT}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return <p className="p-4 text-sm text-red-600 dark:text-red-400 sm:p-5">{loadError}</p>;
  }

  const isTab = variant === "tab";

  const uploadButton = (
    <button
      type="button"
      onClick={openUploadModal}
      disabled={uploadingAttachments}
      className={SHIPMENT_DOCUMENTS_UPLOAD_BUTTON_CLASS}
    >
      <FilePlus2 className="h-4 w-4" strokeWidth={2} aria-hidden />
      {DOCUMENTS_LIST_ADD_LABEL}
    </button>
  );

  return (
    <section
      aria-label="Shipment documents"
      className={isTab ? "flex min-w-0 flex-col" : SHIPMENT_DOCUMENTS_SECTION_CLASS}
    >
      {!isTab ? (
        <div className={SHIPMENT_DOCUMENTS_HEADER_CLASS}>
          <div className="flex items-center justify-between gap-3">
            <div className={SHIPMENT_DOCUMENTS_HEADER_TITLE_ROW_CLASS}>
              <FileText
                className={SHIPMENT_DOCUMENTS_HEADER_ICON_CLASS}
                strokeWidth={2}
                aria-hidden
              />
              <h2 className={SHIPMENT_DOCUMENTS_HEADER_TITLE_CLASS}>{SHIPMENT_DOCUMENTS_HEADER_TITLE}</h2>
            </div>
            {uploadButton}
          </div>
        </div>
      ) : null}

      <div className={isTab ? "flex flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5" : "flex flex-col"}>
        {isTab ? <div className={SHIPMENT_DOCUMENTS_TAB_ACTIONS_CLASS}>{uploadButton}</div> : null}
        <div className={SHIPMENT_DOCUMENTS_LIST_SCROLL_CLASS}>
          <DocumentsList
            variant="embedded"
            naturalHeight
            hideHeader
            currentUserId={currentUserId}
            storedFiles={attachmentsNewestFirst.map((a) => ({
              id: a.id,
              name: a.file_name,
              contentType: a.content_type,
              storagePath: a.storage_path,
              uploadedByUserId: a.uploaded_by,
              uploadedByLabel: messageAuthorByUserId[a.uploaded_by]?.trim() || "Unknown user",
              uploadedByKind: a.uploaded_by_kind ?? "operator",
              documentType: a.document_type,
              documentGroup: a.document_group,
              onOpen: () => void openAttachment(a),
            }))}
            onRemoveFile={(id) => void removeAttachment(id)}
            removingFileId={removingAttachmentId}
            onRenameFile={(id, name) => renameAttachment(id, name)}
            renamingFileId={renamingAttachmentId}
          />
        </div>
      </div>

      <ShipmentDocumentUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        documentGroup={documentGroup}
        onDocumentGroupChange={setDocumentGroup}
        uploading={uploadingAttachments}
        onUpload={handleUpload}
      />
    </section>
  );
}
