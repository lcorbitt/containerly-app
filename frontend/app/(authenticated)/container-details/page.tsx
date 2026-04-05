import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ContainerDetailsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        How tracking fits together
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          In ocean freight, a bill of lading (BOL) is the carrier&apos;s document for a booking. It often lists
          several containers on the same voyage. A booking reference is another common identifier and can also span
          multiple units.
        </p>
        <p>
          In the product, a <strong className="font-medium">shipment</strong> is the commercial move: the BOL or booking
          you are managing. Each shipment owns one or more <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">containers</code>{" "}
          rows (<code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">containers.shipment_id</code>
          ). Each unit usually has a <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">tracking_requests</code>{" "}
          row for operator workflow, sync scheduling, sharing, and timeline—the latest carrier snapshot lives on{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">containers</code>. That matches how
          carrier APIs work: JSONCargo’s bill-of-lading endpoint returns{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">associated_container_numbers</code>
          , and each number is polled separately via their{" "}
          <a
            href="https://jsoncargo.com/documentation-api/"
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            target="_blank"
            rel="noreferrer"
          >
            container details API
          </a>
          .
        </p>
        <p>
          The <strong className="font-medium">Shipments</strong> screen lists shipment rows (grouped BOL imports stay on
          one row; a single-container move is a one-line shipment). Open a shipment to see every container, then open a{" "}
          <strong className="font-medium">workspace</strong> for collaboration, invites, and attachments on that
          container line.
        </p>
        <p>
          The <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">containers</code> table stores
          the latest carrier snapshot (status, location JSON, enrichment) per organization and container number—aligned
          with JSONCargo’s container payload fields such as{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">container_status</code>,{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">last_location</code>, and vessel
          names. You can have several <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">tracking_requests</code>{" "}
          rows pointing at the same container (extra sync/workflow lines); the shared container row reflects whoever
          synced most recently.
        </p>
        <p>
          The <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">shipments</code> table is the
          parent record (reference, optional BOL and carrier line) and stores{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">created_by</code>—the org member
          who owns that commercial shipment.{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">tracking_requests.created_by</code>{" "}
          is kept for audit (who opened the sync line) but is not the product model for ownership.{" "}
          <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">shipment_group_id</code> on
          tracking requests still marks rows created in the same BOL import batch; they share one parent shipment with
          sibling <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">containers</code>.
        </p>
        <p>
          Importer accounts (no freight organization) only see Shipments for containers partners invited them to. The
          shipment API is the same <code className="rounded bg-zinc-100 px-1 font-mono text-xs dark:bg-zinc-800">get-shipment</code>{" "}
          function for both org members and importers; visibility rules differ.
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
