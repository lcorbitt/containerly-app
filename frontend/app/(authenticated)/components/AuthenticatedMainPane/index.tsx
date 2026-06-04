"use client";

import { PageLoading } from "@/components/PageLoading";
import { useNavigationProgress } from "@/components/NavigationProgress";
import {
  AUTHENTICATED_MAIN_PANE_BLOCKER_CLASS,
  AUTHENTICATED_MAIN_PANE_LOADING_LAYER_CLASS,
  AUTHENTICATED_MAIN_PANE_ROOT_CLASS,
} from "./constants";

export function AuthenticatedMainPane({ children }: { children: React.ReactNode }) {
  const { isNavigating, loadingText } = useNavigationProgress();

  return (
    <div className={AUTHENTICATED_MAIN_PANE_ROOT_CLASS}>
      {/* Children stay mounted under the overlay so the destination page can load its data while the
          navigation overlay holds; it lifts only once that page reports ready (content gate). */}
      {children}
      {isNavigating ? (
        <div className="absolute inset-0 z-10" aria-hidden={false}>
          <div className={AUTHENTICATED_MAIN_PANE_BLOCKER_CLASS} aria-hidden />
          <div
            className={AUTHENTICATED_MAIN_PANE_LOADING_LAYER_CLASS}
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <PageLoading loadingText={loadingText ?? undefined} variant="overlay" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
