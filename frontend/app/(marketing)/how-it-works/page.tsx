import Link from "next/link";
import type { ReactNode } from "react";

const toc = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Roles & Workspaces" },
  { id: "shipment-lifecycle", label: "Shipment Lifecycle" },
  { id: "documents", label: "Documents & Approvals" },
  { id: "customer-portal", label: "Customer Portal & Access" },
  { id: "messages-activity", label: "Messages & Activity Timeline" },
  { id: "tracking-alerts", label: "Tracking & Notifications" },
  { id: "permissions", label: "Permissions Model" },
  { id: "glossary", label: "Glossary" },
] as const;

function Toc() {
  return (
    <nav aria-label="Table of contents" className="space-y-2 text-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Contents</p>
      <ul className="space-y-1.5">
        {toc.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block rounded-md px-2 py-1 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Section(props: { id: string; title: string; children: ReactNode; eyebrow?: string }) {
  return (
    <section id={props.id} className="scroll-mt-24">
      {props.eyebrow ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary-orange">{props.eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-2xl">
        {props.title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{props.children}</div>
    </section>
  );
}

function Callout(props: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-sm font-semibold text-zinc-900 dark:text-white">{props.title}</p>
      <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">{props.children}</div>
    </div>
  );
}

function DefinitionRow(props: { k: string; v: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-zinc-950">
      <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">{props.k}</dt>
      <dd className="text-sm text-zinc-700 dark:text-zinc-300">{props.v}</dd>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] border-t border-zinc-200 bg-zinc-50 px-4 py-10 dark:border-white/[0.06] dark:bg-zinc-950 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Toc />
            <div className="mt-6 hidden rounded-2xl border border-primary-orange/25 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent p-4 text-sm text-zinc-700 dark:border-primary-orange/30 dark:text-zinc-300 lg:block">
              <p className="font-medium text-zinc-900 dark:text-white">Want to see it live?</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Open the app and follow the same steps with a real shipment.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-primary-orange/70 bg-white px-4 py-2 text-sm font-semibold text-primary-orange shadow-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/5 active:scale-[0.98] dark:border-primary-orange/85 dark:bg-black/55 dark:hover:bg-primary-orange/10"
              >
                Sign In
              </Link>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="rounded-3xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-white/[0.08] dark:bg-zinc-950 md:p-10">
              <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
                How it works
              </p>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
                A documentation-first shipment workflow with a customer portal, tracking, and shared accountability.
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                Containerly is designed to replace fragmented status updates with one credible record. Teams manage
                commercial details, documents, and milestones in a shipment workspace, then publish the same narrative
                to customers in a branded portal.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-primary-orange/70 bg-primary-orange px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[box-shadow,transform,background-color] hover:bg-primary-orange/90 active:scale-[0.98]"
                >
                  Open the app
                </Link>
                <Link
                  href="/#features"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-orange/40 hover:text-zinc-900 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                >
                  Back to the landing page
                </Link>
              </div>
            </header>

            <div className="mt-10 space-y-12">
              <Section id="overview" title="Overview" eyebrow="Big picture">
                <p>
                  Think of Containerly as two connected surfaces:
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Operator workspace</strong> for building and maintaining the shipment record (commercial
                    details, documents, approvals, tracking, and team coordination).
                  </li>
                  <li>
                    <strong>Customer portal</strong> for sharing the right slice of that record with customers and
                    partners (documents, timeline, messages, and updates).
                  </li>
                </ul>
                <Callout title="Design goal">
                  <p>
                    Every update stays tied to a shipment record and its evidence (files, milestones, and messages), so
                    you can answer “what’s true?” without cross-checking inboxes or carrier sites.
                  </p>
                </Callout>
              </Section>

              <Section id="roles" title="Roles & workspaces" eyebrow="Who uses it">
                <div className="grid gap-3 md:grid-cols-2">
                  <DefinitionRow
                    k="Organization"
                    v="Your company workspace. Shipments, members, and permissions are scoped to an organization."
                  />
                  <DefinitionRow
                    k="Organization members"
                    v="Internal users who can collaborate on shipments (admins can manage settings and invites)."
                  />
                  <DefinitionRow
                    k="Customers (partners)"
                    v="External users who access shipments through a portal invite and only see what you share."
                  />
                  <DefinitionRow
                    k="Shipment workspace"
                    v="The single record that holds commercial details, documents, approvals, messages, and milestones."
                  />
                </div>
                <Callout title="Invite-based onboarding">
                  <p>
                    Internal teammates and customers typically join via email invitation. This keeps access tied to a
                    verified address and avoids forwarding links or unmanaged spreadsheets.
                  </p>
                </Callout>
              </Section>

              <Section id="shipment-lifecycle" title="Shipment lifecycle" eyebrow="Operator workflow">
                <p>
                  A shipment starts as a structured commercial record and evolves into a shared timeline.
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    <strong>Create the shipment</strong> and enter header details.
                  </li>
                  <li>
                    <strong>Add order lines</strong> (so quantities, SKUs, and references are anchored to the shipment).
                  </li>
                  <li>
                    <strong>Attach documents</strong> and route drafts for customer sign-off.
                  </li>
                  <li>
                    <strong>Publish the portal</strong> by inviting the customer and selecting what they should see.
                  </li>
                  <li>
                    <strong>Track milestones</strong> as identifiers become available and events arrive.
                  </li>
                </ol>
                <Callout title="What “done” looks like">
                  <p>
                    A completed workflow has approved documents, a durable activity trail, and a customer portal that
                    answers the recurring “status + paperwork” questions without reopening the same email thread.
                  </p>
                </Callout>
              </Section>

              <Section id="documents" title="Documents & approvals" eyebrow="Workflow">
                <p>
                  Documents are not just attachments — they are part of the operational workflow.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Upload drafts</strong> and keep versions tied to the shipment.
                  </li>
                  <li>
                    <strong>Request customer review</strong> so approvals and rejections are explicit.
                  </li>
                  <li>
                    <strong>Capture the outcome</strong> (approved or rejected) with timestamps and context.
                  </li>
                </ul>
                <Callout title="Why this matters">
                  <p>
                    Approvals create a clear checkpoint for downstream steps (finalization, mailing, and publishing the
                    narrative). Customers get one place to review and sign off — not a series of forwarded PDFs.
                  </p>
                </Callout>
              </Section>

              <Section id="customer-portal" title="Customer portal & access" eyebrow="External collaboration">
                <p>
                  Customers access shipments through a branded portal linked to their verified account.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    Customers receive an <strong>invite email</strong> and complete sign-in.
                  </li>
                  <li>
                    Access is scoped to specific shipments with <strong>visibility settings</strong>.
                  </li>
                  <li>
                    Customers can <strong>review documents</strong>, follow timeline updates, and message in context.
                  </li>
                </ul>
                <Callout title="Operational outcome">
                  <p>
                    Instead of sending “status emails,” you publish the current truth once and let customers self-serve
                    the details whenever they need them.
                  </p>
                </Callout>
              </Section>

              <Section id="messages-activity" title="Messages & activity timeline" eyebrow="Shared narrative">
                <p>
                  Containerly keeps communication attached to the shipment record:
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Messages</strong> capture questions and answers without losing context.
                  </li>
                  <li>
                    <strong>Activity events</strong> track key workflow moments (invites, approvals, document actions).
                  </li>
                  <li>
                    The timeline stays <strong>searchable and auditable</strong> for internal teams and customers.
                  </li>
                </ul>
                <Callout title="Replace inbox archaeology">
                  <p>
                    When someone asks “why did we decide that?” you can point to the shipment’s activity and messages,
                    not an internal email chain that the customer can’t see.
                  </p>
                </Callout>
              </Section>

              <Section id="tracking-alerts" title="Tracking & notifications" eyebrow="Stay ahead of exceptions">
                <p>
                  Once tracking identifiers are available, Containerly can sync milestones into the shipment timeline.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Track containers</strong> and store milestone history.
                  </li>
                  <li>
                    <strong>Surface changes</strong> as timeline updates rather than ad hoc screenshots.
                  </li>
                  <li>
                    <strong>Notify subscribers</strong> so the right people see exceptions early and return to the portal.
                  </li>
                </ul>
                <Callout title="Notification philosophy">
                  <p>
                    Alerts should point back to the portal record, so every update has context and evidence — not a
                    detached “FYI” that starts a new thread.
                  </p>
                </Callout>
              </Section>

              <Section id="permissions" title="Permissions model" eyebrow="Governance">
                <p>
                  Access is intentionally separated into two layers:
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Internal access</strong> via organization membership (admins vs members).
                  </li>
                  <li>
                    <strong>External access</strong> via customer shipment access grants (scoped to specific shipments).
                  </li>
                </ul>
                <Callout title="Rule of thumb">
                  <p>
                    If someone is internal to your team, add them to your organization. If they are a customer or
                    partner, invite them to the portal and grant access per shipment.
                  </p>
                </Callout>
              </Section>

              <Section id="glossary" title="Glossary" eyebrow="Reference">
                <div className="grid gap-3 md:grid-cols-2">
                  <DefinitionRow
                    k="Shipment"
                    v="The primary record: commercial details + documents + timeline + collaboration."
                  />
                  <DefinitionRow
                    k="Shipment line"
                    v="A structured item/line on a shipment for quantities and references (order/booking detail)."
                  />
                  <DefinitionRow
                    k="Customer portal"
                    v="The external view where customers review documents, track progress, and message in context."
                  />
                  <DefinitionRow
                    k="Activity timeline"
                    v="A structured history of key shipment and portal events (invites, approvals, updates)."
                  />
                  <DefinitionRow
                    k="Milestones"
                    v="Tracking events and operational checkpoints that build the narrative of what happened and what’s next."
                  />
                  <DefinitionRow
                    k="Notifications"
                    v="Signals that bring subscribers back to the portal with context when something changes."
                  />
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

