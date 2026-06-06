import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContainerDetailsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        How Containerly works
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          Containerly is built for <strong className="font-medium">documentation-first export shipments</strong>.
          Operators enter commercial details manually, upload export documents, and invite customers to a branded
          portal. Carrier container tracking is an optional premium step after customers approve the paperwork.
        </p>
        <ol className="list-decimal space-y-3 pl-5">
          <li>
            <strong className="font-medium">Create a shipment</strong> — commercial header (customer, ports, vessel,
            health certificate, etc.) plus order/booking lines. Use <strong className="font-medium">New Shipment</strong>{" "}
            in the header.
          </li>
          <li>
            <strong className="font-medium">Upload documents</strong> — attach drafts from the shipment workspace,
            classify document type, and send them for customer review on the portal.
          </li>
          <li>
            <strong className="font-medium">Customer portal</strong> — customers approve or reject documents, follow
            the activity feed, and message your team. Physical mail tracking can be added after approval.
          </li>
          <li>
            <strong className="font-medium">Optional carrier tracking (premium)</strong> — once export documents are
            approved and container numbers are published, enable live carrier sync from the shipment workspace. This
            pulls milestones into the same portal timeline.
          </li>
        </ol>
        <p>
          In the data model, a <strong className="font-medium">shipment</strong> is the commercial move you manage.
          <code className="mx-1 rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">shipment_lines</code>
          hold order/booking rows. When you enable carrier sync, each container number gets a{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">tracking_requests</code> row
          and carrier snapshots land on{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">containers</code>.
        </p>
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/40">
          <summary className="cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
            Advanced: carrier API &amp; BOL bulk import
          </summary>
          <p className="mt-2">
            For teams with premium carrier sync enabled, Containerly can poll external container APIs (JSONCargo-style)
            per container number. A bill-of-lading bulk import creates multiple container lines on one shipment when the
            carrier publishes many units on a single document — this is optional and lives behind{" "}
            <strong className="font-medium">Enable carrier sync</strong> in the shipment workspace, not the primary
            onboarding path.
          </p>
        </details>
        <p>
          Customer accounts (no freight organization) see only shipments partners invited them to. Operators manage
          everything from <Link href="/shipments" className="font-medium underline">Shipments</Link> and the per-shipment
          workspace (documents, invites, messages).
        </p>
      </div>
      <p className="mt-8 text-sm">
        <Link href="/shipments" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Go to Shipments
        </Link>
        {" · "}
        <Link href="/dashboard" className="font-medium text-zinc-900 underline dark:text-zinc-100">
          Dashboard
        </Link>
      </p>
    </div>
  );
}
