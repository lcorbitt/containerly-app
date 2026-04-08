/**
 * Deployed Supabase Edge function slugs: `supabase/functions/<slug>/index.ts` →
 * `GET|POST ${SUPABASE_URL}/functions/v1/<slug>`.
 *
 * Slugs are **verb-first** (CRUD / HTTP-style): e.g. `create-tracking-request`, `get-shipment`,
 * `create-customer-invite`. Group keys (`tracking`, `shipments`, …) are **caller grouping only**
 * (flat slug namespace).
 */
export const EDGE_FUNCTION_SLUGS = {
  tracking: {
    createRequest: "create-tracking-request",
    getContainerDetails: "get-container-details",
    searchContainers: "search-containers",
    syncContainer: "sync-container",
    syncStaleRequests: "sync-stale-tracking-requests",
    lookupBolContainers: "lookup-bol-containers",
  },
  shipments: {
    get: "get-shipment",
    postCustomerMessage: "post-customer-shipment-message",
    previewCustomer: "preview-customer-shipment",
  },
  customers: {
    createInvite: "create-customer-invite",
    acceptInvite: "accept-customer-invite",
    completeShipmentSetup: "complete-customer-shipment-setup",
  },
  reports: {
    getPublic: "get-public-report",
    postMessage: "post-report-message",
  },
} as const;
