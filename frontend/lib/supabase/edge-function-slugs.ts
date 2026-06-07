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
    create: "create-shipment",
    update: "update-shipment",
    updateRisk: "update-shipment-risk",
    delete: "delete-shipment",
    reviewDocument: "review-shipment-document",
    claimAccess: "claim-shipment-access",
    postCustomerMessage: "post-customer-shipment-message",
    previewCustomer: "preview-customer-shipment",
  },
  customers: {
    createInvite: "create-customer-invite",
    acceptInvite: "accept-customer-invite",
    completeShipmentSetup: "complete-customer-shipment-setup",
    checkPortalAccessEmail: "check-portal-access-email",
    resolveAccessRequest: "resolve-customer-access-request",
    previewInvite: "preview-customer-invite",
  },
  reports: {
    getPublic: "get-public-report",
    postMessage: "post-report-message",
  },
  performance: {
    sendStaleReminders: "send-stale-shipment-reminders",
  },
  feedback: {
    submit: "submit-feedback",
  },
} as const;
