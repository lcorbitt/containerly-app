import type { NavigationStartInput } from "./resolve-navigation-start";

export type NavigationProgressPhase = "idle" | "active" | "completing";

export interface NavigationProgressContextValue {
  phase: NavigationProgressPhase;
  isNavigating: boolean;
  loadingText: string | null;
  startNavigation: (input?: NavigationStartInput) => void;
}
