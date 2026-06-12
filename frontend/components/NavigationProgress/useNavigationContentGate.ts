"use client";

import { useEffect, useRef } from "react";
import { useNavigationProgress } from "./useNavigationProgress";

/**
 * Holds the global navigation overlay open until a destination page's primary data is ready, so the
 * user sees one continuous "Loading <entity>…" overlay instead of the nav overlay followed by a
 * second page-level loader.
 *
 * Call once at the top of a route's main component (before any early returns) with whether its data
 * is ready. While the navigation overlay is active the page should render
 * `null` in place of its own full-page loader (use the returned `overlayActive`) — the overlay is
 * already covering it. On a direct load / refresh there is no overlay, so the page shows its own
 * loader as usual.
 */
export function useNavigationContentGate(ready: boolean): { overlayActive: boolean } {
  const { isNavigating, claimContentGate, releaseContentGate } = useNavigationProgress();
  const claimedRef = useRef(false);

  // Claim whenever the page is not ready and release once it is. Driving this off `ready` (rather
  // than mount) also covers same-route param changes (e.g. shipment A → shipment B), where the
  // component is reused and only re-enters its loading state.
  useEffect(() => {
    if (!ready && !claimedRef.current) {
      claimedRef.current = true;
      claimContentGate();
    } else if (ready && claimedRef.current) {
      claimedRef.current = false;
      releaseContentGate({ ready: true });
    }
  }, [ready, claimContentGate, releaseContentGate]);

  useEffect(
    () => () => {
      if (claimedRef.current) {
        claimedRef.current = false;
        releaseContentGate({ ready: false });
      }
    },
    [releaseContentGate],
  );

  return { overlayActive: isNavigating };
}
