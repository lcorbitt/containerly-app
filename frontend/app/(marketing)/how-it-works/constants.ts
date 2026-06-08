export interface HowItWorksTocItem {
  id: string;
  label: string;
}

export interface HowItWorksDefinition {
  k: string;
  v: string;
}

export const HOW_IT_WORKS_TOC: readonly HowItWorksTocItem[] = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Roles & Workspaces" },
  { id: "shipment-lifecycle", label: "Shipment Lifecycle" },
  { id: "documents", label: "Documents & Approvals" },
  { id: "sharing", label: "Sharing & Access Controls" },
  { id: "customer-portal", label: "Customer Portal & Access" },
  { id: "messages-activity", label: "Messages & Activity Timeline" },
  { id: "tracking-alerts", label: "Tracking & Notifications" },
  { id: "permissions", label: "Permissions Model" },
  { id: "glossary", label: "Glossary" },
] as const;

export const HOW_IT_WORKS_HERO = {
  eyebrow: "How It Works",
  title: "Documentation-first shipments with invite-gated customer portals.",
  subcopy:
    "Containerly replaces fragmented status updates with one credible record. Teams manage commercial details, documents, and milestones in a shipment workspace, then publish the same narrative to verified customers in a branded portal — not anonymous public links.",
  sidebarTitle: "Want to see it live?",
  sidebarBody: "Open the app and follow the same steps with a real shipment.",
  primaryCta: "Open the app",
  secondaryCta: "Back to the landing page",
} as const;

export const HOW_IT_WORKS_ROLE_DEFINITIONS: readonly HowItWorksDefinition[] = [
  {
    k: "Organization",
    v: "Your company workspace. Shipments, members, and permissions are scoped to an organization.",
  },
  {
    k: "Organization members (operators)",
    v: "Internal users who collaborate on shipments. Admins manage settings, branding, and invites; members work on assigned shipments.",
  },
  {
    k: "Customers (partners)",
    v: "External users who access shipments through a portal invite or approved access request. They only see what you share per shipment.",
  },
  {
    k: "Shipment workspace",
    v: "The single record that holds commercial details, documents, approvals, messages, and milestones.",
  },
  {
    k: "My Shipments",
    v: "The customer's multi-shipment home after sign-in — a searchable list of every shipment a partner has invited them to.",
  },
];

export const HOW_IT_WORKS_GLOSSARY: readonly HowItWorksDefinition[] = [
  {
    k: "Shipment",
    v: "The primary record: commercial details + documents + timeline + collaboration.",
  },
  {
    k: "Shipment line",
    v: "A structured item/line on a shipment for quantities and references (order/booking detail).",
  },
  {
    k: "Customer portal",
    v: "The external view where customers review documents, track progress, and message in context.",
  },
  {
    k: "My Shipments",
    v: "The authenticated customer dashboard listing every shipment they have access to.",
  },
  {
    k: "Hub link",
    v: "The copyable portal URL for a shipment. Customers enter their email at the gate; invited addresses sign in automatically.",
  },
  {
    k: "Allowlist",
    v: "An email pre-approved for a shipment without sending an invite message. The operator shares the hub link manually.",
  },
  {
    k: "Access request",
    v: "When a visitor enters their email at the portal gate and asks for access. Operators approve or deny from the Share menu.",
  },
  {
    k: "Workflow status",
    v: "Export document stages: Pending Drafts, Awaiting Review, Approved, Rejected, and Originals Sent.",
  },
  {
    k: "Activity timeline",
    v: "A structured history of key shipment and portal events (invites, approvals, access requests, updates).",
  },
  {
    k: "Milestones",
    v: "Tracking events and operational checkpoints that build the narrative of what happened and what's next.",
  },
  {
    k: "Notifications",
    v: "Signals that bring subscribers back to the portal with context when something changes.",
  },
];
