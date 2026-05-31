"use client";

import { DocumentsList } from "@/components/DocumentsList";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { ShipmentDocumentUploadZone } from "./ShipmentDocumentUploadZone";
import {
  SHIPMENT_DOCUMENTS_PANEL_HEIGHT,
  SHIPMENT_DOCUMENTS_SECTION_CLASS,
} from "./constants";
import { useShipmentWorkspaceScopePanel } from "./hooks/useShipmentWorkspaceScopePanel";

export function ShipmentWorkspaceScopePanel({ shipmentId }: { shipmentId: string }) {
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
    uploadModalOpen,
    closeUploadModal,
    openUploadModalWithFiles,
    uploadModalInitialFiles,
    uploadAttachmentFiles,
    uploadingAttachments,
    renameAttachment,
    renamingAttachmentId,
    removeAttachment,
    removingAttachmentId,

    attachmentsNewestFirst,
  } = useShipmentWorkspaceScopePanel({ shipmentId });

  if (!selectedOrgId) {
    return (
      <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
        Select an organization in the header to manage this shipment.
      </p>
    );
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading shipment documents…</p>;
  }

  if (loadError) {
    return <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>;
  }

  return (
    <section aria-label="Shipment documents" className={SHIPMENT_DOCUMENTS_SECTION_CLASS}>
      <div className="flex shrink-0 flex-col gap-1 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          All files are visible to the customer. Operator and customer uploads are labeled below.
        </p>
      </div>

      <div
        className="flex min-h-0 flex-col overflow-hidden"
        style={{ height: SHIPMENT_DOCUMENTS_PANEL_HEIGHT }}
      >
        <ShipmentDocumentUploadZone
          disabled={uploadingAttachments}
          onFilesSelected={openUploadModalWithFiles}
        />
        <DocumentsList
          variant="embedded"
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
            onOpen: () => void openAttachment(a),
          }))}
          uploading={uploadingAttachments}
          onRemoveFile={(id) => void removeAttachment(id)}
          removingFileId={removingAttachmentId}
          onRenameFile={(id, name) => renameAttachment(id, name)}
          renamingFileId={renamingAttachmentId}
        />
      </div>

      <DocumentUploadModal
        open={uploadModalOpen}
        onClose={() => closeUploadModal()}
        initialFiles={uploadModalInitialFiles}
        showDocumentMetadata
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        documentGroup={documentGroup}
        onDocumentGroupChange={setDocumentGroup}
        uploading={uploadingAttachments}
        onUpload={uploadAttachmentFiles}
      />
    </section>
  );
}
