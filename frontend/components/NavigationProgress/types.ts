import type { NavigationStartInput } from "./resolve-navigation-start";

export type NavigationProgressPhase = "idle" | "active" | "completing";

export interface NavigationProgressContextValue {
  phase: NavigationProgressPhase;
  isNavigating: boolean;
  loadingText: string | null;
  startNavigation: (input?: NavigationStartInput) => void;
  /**
   * Destination pages call this on mount to take ownership of the navigation overlay: the overlay
   * stays up (instead of finishing on route commit) until the page reports its primary data is
   * ready. Pair with `releaseContentGate`. Prefer the `useNavigationContentGate` hook.
   */
  claimContentGate: () => void;
  /** Release a previously claimed gate. `ready: true` finishes the overlay; `false` is an unmount. */
  releaseContentGate: (options: { ready: boolean }) => void;
}
