export type NavigationProgressPhase = "idle" | "active" | "completing";

export interface NavigationProgressContextValue {
  phase: NavigationProgressPhase;
  isNavigating: boolean;
  destinationLabel: string | null;
  loadingText: string | null;
  startNavigation: (destinationLabel?: string) => void;
}
