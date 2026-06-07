"use client";

import { createPortal } from "react-dom";
import { useRef, useSyncExternalStore } from "react";
import { PageLoading } from "@/components/PageLoading";
import { useNavigationProgress } from "@/components/NavigationProgress";
import {
  AUTHENTICATED_MAIN_PANE_BLOCKER_CLASS,
  AUTHENTICATED_MAIN_PANE_LOADING_LAYER_CLASS,
  AUTHENTICATED_MAIN_PANE_OVERLAY_FIXED_CLASS,
  AUTHENTICATED_MAIN_PANE_ROOT_CLASS,
} from "./constants";
import { useAuthenticatedMainPaneOverlay } from "./useAuthenticatedMainPaneOverlay";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AuthenticatedMainPane({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  const { isNavigating, loadingText } = useNavigationProgress();
  const overlayBounds = useAuthenticatedMainPaneOverlay(rootRef, isNavigating);

  const overlay =
    isClient &&
    isNavigating &&
    overlayBounds &&
    typeof document !== "undefined"
      ? createPortal(
          <div
            className={AUTHENTICATED_MAIN_PANE_OVERLAY_FIXED_CLASS}
            style={{
              top: overlayBounds.top,
              left: overlayBounds.left,
              width: overlayBounds.width,
              height: overlayBounds.height,
            }}
            aria-hidden={false}
          >
            <div className={AUTHENTICATED_MAIN_PANE_BLOCKER_CLASS} aria-hidden />
            <div
              className={AUTHENTICATED_MAIN_PANE_LOADING_LAYER_CLASS}
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <PageLoading loadingText={loadingText ?? undefined} variant="overlay" />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={AUTHENTICATED_MAIN_PANE_ROOT_CLASS}>
      {/* Children stay mounted under the overlay so the destination page can load its data while the
          navigation overlay holds; it lifts only once that page reports ready (content gate). */}
      {children}
      {overlay}
    </div>
  );
}
