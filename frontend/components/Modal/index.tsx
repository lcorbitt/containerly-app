"use client";

import { createPortal } from "react-dom";
import { DialogCloseButton } from "@/components/DialogCloseButton";
import { Reveal } from "@/components/Reveal";
import {
  MODAL_BACKDROP_CLASS,
  MODAL_BODY_CLASS,
  MODAL_CONTENT_BLUR_CLASS,
  MODAL_CONTENT_WRAPPER_CLASS,
  MODAL_DESCRIPTION_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_ACTIONS_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_HEADER_TEXT_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_BASE_CLASS,
  MODAL_SHELL_CLASS,
  MODAL_SIZE_CLASS,
  MODAL_TITLE_CLASS,
} from "./constants";
import type { ModalProps } from "./types";
import { useModalBehavior } from "./useModalBehavior";

export type { ModalProps, ModalSize } from "./types";

/**
 * Shared modal shell: portal, backdrop, animated panel, header (title + close button),
 * scrollable body, and optional footer. Centralizes structure and styling so a single
 * change here restyles every modal in the app.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  headerActions,
  footer,
  children,
  size = "lg",
  role = "dialog",
  busy = false,
  hideCloseButton = false,
  closeButtonTone,
  disableBackdropClose = false,
  disableEscapeClose = false,
  onSubmit,
  overlay,
  overlayClassName = MODAL_OVERLAY_CLASS,
  panelClassName,
  bodyClassName,
  ariaLabel,
  describedById,
}: ModalProps) {
  const { portalReady, titleId, panelRef } = useModalBehavior({
    open,
    onClose,
    busy,
    disableEscapeClose,
  });

  if (!portalReady || typeof document === "undefined") return null;

  const requestClose = () => {
    if (!busy) onClose();
  };

  const hasHeader = title != null || description != null || headerActions != null || !hideCloseButton;

  const bodyContent = (
    <>
      {hasHeader ? (
        <div className={MODAL_HEADER_CLASS}>
          <div className={MODAL_HEADER_TEXT_CLASS}>
            {title != null ? (
              <h2 id={titleId} className={MODAL_TITLE_CLASS}>
                {title}
              </h2>
            ) : null}
            {description != null ? <p className={MODAL_DESCRIPTION_CLASS}>{description}</p> : null}
          </div>
          {headerActions != null || !hideCloseButton ? (
            <div className={MODAL_HEADER_ACTIONS_CLASS}>
              {headerActions}
              {!hideCloseButton ? (
                <DialogCloseButton onClick={requestClose} disabled={busy} tone={closeButtonTone} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={`${MODAL_BODY_CLASS}${bodyClassName ? ` ${bodyClassName}` : ""}`}>{children}</div>

      {footer != null ? <div className={MODAL_FOOTER_CLASS}>{footer}</div> : null}
    </>
  );

  const content = onSubmit ? (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      {bodyContent}
    </form>
  ) : (
    bodyContent
  );

  return createPortal(
    <Reveal show={open} className={overlayClassName}>
      <div className={MODAL_SHELL_CLASS}>
        <button
          type="button"
          aria-label="Close dialog"
          className={MODAL_BACKDROP_CLASS}
          onClick={() => {
            if (!disableBackdropClose) requestClose();
          }}
        />
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-label={title == null ? ariaLabel : undefined}
          aria-labelledby={title != null ? titleId : undefined}
          aria-describedby={describedById}
          tabIndex={-1}
          className={`${MODAL_PANEL_BASE_CLASS} ${MODAL_SIZE_CLASS[size]}${panelClassName ? ` ${panelClassName}` : ""}`}
        >
          <div className={MODAL_CONTENT_WRAPPER_CLASS}>
            <div
              className={`flex min-h-0 flex-1 flex-col ${
                overlay && busy ? `transition-[filter,opacity] ${MODAL_CONTENT_BLUR_CLASS}` : ""
              }`}
            >
              {content}
            </div>
            {overlay}
          </div>
        </div>
      </div>
    </Reveal>,
    document.body,
  );
}
