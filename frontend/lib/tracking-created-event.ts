/** Fired after a new tracking line is created (single container or BOL import). Client lists can subscribe to refresh. */
export const TRACKING_CREATED_EVENT = "containerly:tracking-created";

export function emitTrackingCreated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TRACKING_CREATED_EVENT));
}
