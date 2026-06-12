import Link from "next/link";
import type { ReactNode } from "react";
import { MarketingFooter } from "../../../components/MarketingFooter";
import {
  HOW_IT_WORKS_GLOSSARY,
  HOW_IT_WORKS_HERO,
  HOW_IT_WORKS_ROLE_DEFINITIONS,
  HOW_IT_WORKS_TOC,
} from "../../constants";

function Toc() {
  return (
    <nav aria-label="Table of contents" className="space-y-2 text-sm">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Contents</p>
      <ul className="space-y-1.5">
        {HOW_IT_WORKS_TOC.map((item) => (
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

export function HowItWorksPage() {
  return (
    <>
    <main className="min-h-[calc(100vh-4rem)] border-t border-zinc-200 bg-zinc-50 px-4 py-10 dark:border-white/[0.06] dark:bg-zinc-950 md:px-8 md:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[16rem_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Toc />
            <div className="mt-6 hidden rounded-2xl border border-primary-orange/25 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent p-4 text-sm text-zinc-700 dark:border-primary-orange/30 dark:text-zinc-300 lg:block">
              <p className="font-medium text-zinc-900 dark:text-white">{HOW_IT_WORKS_HERO.sidebarTitle}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{HOW_IT_WORKS_HERO.sidebarBody}</p>
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
                {HOW_IT_WORKS_HERO.eyebrow}
              </p>
              <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-5xl">
                {HOW_IT_WORKS_HERO.title}
              </h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
                {HOW_IT_WORKS_HERO.subcopy}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full border border-primary-orange/70 bg-primary-orange px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[box-shadow,transform,background-color] hover:bg-primary-orange/90 active:scale-[0.98]"
                >
                  {HOW_IT_WORKS_HERO.primaryCta}
                </Link>
                <Link
                  href="/#features"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-orange/40 hover:text-zinc-900 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                >
                  {HOW_IT_WORKS_HERO.secondaryCta}
                </Link>
              </div>
            </header>

            <div className="mt-10 space-y-12">
              <Section id="overview" title="Overview" eyebrow="Big picture">
                <p>Think of Containerly as two connected surfaces:</p>
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
                <p>
                  Customers sign in with their invited email address. When eligible, they are signed in automatically
                  at the portal gate — no password needed.
                </p>
                <Callout title="Design goal">
                  <p>
                    Every update stays tied to a shipment record and its evidence (files, milestones, and messages), so
                    you can answer &ldquo;what&apos;s true?&rdquo; without cross-checking inboxes or carrier sites.
                  </p>
                </Callout>
              </Section>

              <Section id="roles" title="Roles & workspaces" eyebrow="Who uses it">
                <div className="grid gap-3 md:grid-cols-2">
                  {HOW_IT_WORKS_ROLE_DEFINITIONS.map((row) => (
                    <DefinitionRow key={row.k} k={row.k} v={row.v} />
                  ))}
                </div>
                <Callout title="Invite-based onboarding">
                  <p>
                    Internal teammates join via organization invite. Customers join via portal invite, allowlist, or
                    approved access request. Access stays tied to a verified email — there are no unmanaged public
                    report links.
                  </p>
                </Callout>
              </Section>

              <Section id="shipment-lifecycle" title="Shipment lifecycle" eyebrow="Operator workflow">
                <p>A shipment starts as a structured commercial record and evolves into a shared timeline.</p>
                <ol className="list-decimal space-y-1 pl-5">
                  <li>
                    <strong>Create the shipment</strong> and enter header details plus order lines.
                  </li>
                  <li>
                    <strong>Upload drafts</strong> and move the shipment to <strong>Pending Drafts</strong>.
                  </li>
                  <li>
                    <strong>Route for customer review</strong> — the shipment becomes <strong>Awaiting Review</strong>,
                    then <strong>Approved</strong> or <strong>Rejected</strong> based on customer sign-off.
                  </li>
                  <li>
                    <strong>Share the portal</strong> by inviting customers (or allowlisting their email) and
                    configuring what each person sees.
                  </li>
                  <li>
                    <strong>Mail originals</strong> and mark <strong>Originals Sent</strong>; add carrier tracking when
                    identifiers become available.
                  </li>
                </ol>
                <Callout title="What &ldquo;done&rdquo; looks like">
                  <p>
                    A completed workflow has approved documents, a durable activity trail, and a customer portal that
                    answers the recurring &ldquo;status + paperwork&rdquo; questions without reopening the same email
                    thread.
                  </p>
                </Callout>
              </Section>

              <Section id="documents" title="Documents & approvals" eyebrow="Workflow">
                <p>Documents are not just attachments — they are part of the operational workflow.</p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Upload drafts</strong> and keep versions tied to the shipment. The workflow status shows{" "}
                    <strong>Pending Drafts</strong>.
                  </li>
                  <li>
                    <strong>Request customer review</strong> so the shipment moves to <strong>Awaiting Review</strong>.
                  </li>
                  <li>
                    <strong>Capture the outcome</strong> — <strong>Approved</strong> or <strong>Rejected</strong> — with
                    timestamps and context on the activity timeline.
                  </li>
                  <li>
                    After mailing, mark <strong>Originals Sent</strong> so everyone sees the same stage label in the
                    portal.
                  </li>
                </ul>
                <Callout title="Why this matters">
                  <p>
                    Approvals create a clear checkpoint for downstream steps (finalization, mailing, and publishing the
                    narrative). Customers get one place to review and sign off — not a series of forwarded PDFs.
                  </p>
                </Callout>
              </Section>

              <Section id="sharing" title="Sharing & access controls" eyebrow="Operator controls">
                <p>
                  The Share menu on each shipment is where operators grant access, copy links, and respond to inbound
                  requests.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Send invite email</strong> — Containerly emails the customer with a link to the shipment
                    portal.
                  </li>
                  <li>
                    <strong>Allowlist only</strong> — pre-approve an email without sending a message; you share the{" "}
                    <strong>hub link</strong> yourself (useful when you already communicate by phone or chat).
                  </li>
                  <li>
                    <strong>Hub link</strong> — copy the portal URL from Share and send it through any channel. The
                    customer enters their email at the gate.
                  </li>
                  <li>
                    <strong>Access requests</strong> — if someone visits the hub link without access, they can request
                    it. You approve or deny from the Share menu.
                  </li>
                  <li>
                    <strong>Per-customer visibility</strong> — toggle alerts, carrier timeline, bill of lading, live
                    vessel (AIS), and raw carrier data independently for each customer.
                  </li>
                  <li>
                    <strong>Portal overrides</strong> — set a customer note, custom status label, last location, and ETA
                    text shown at the top of their view.
                  </li>
                </ul>
                <Callout title="One entitlement per email">
                  <p>
                    Each shipment and email address has a single pending entitlement. An invite and an access request
                    for the same person converge into one grant — you never manage duplicate access rows.
                  </p>
                </Callout>
              </Section>

              <Section id="customer-portal" title="Customer portal & access" eyebrow="External collaboration">
                <p>Customers access shipments through a branded portal linked to their verified account.</p>
                <ul className="list-disc pl-5">
                  <li>
                    At the portal gate, customers enter their email. If they&apos;ve been invited, they&apos;re signed
                    in automatically — no password needed.
                  </li>
                  <li>
                    The portal carries your <strong>organization logo</strong> and presents a professional, branded
                    experience.
                  </li>
                  <li>
                    After sign-in, <strong>My Shipments</strong> lists every shipment they can access — not just the
                    one link they clicked today.
                  </li>
                  <li>
                    On each shipment, customers <strong>review documents</strong>, follow timeline updates, and message
                    in context.
                  </li>
                  <li>
                    Legacy anonymous report URLs are no longer supported — access requires signing in with an invited
                    email.
                  </li>
                </ul>
                <Callout title="Operational outcome">
                  <p>
                    Instead of sending &ldquo;status emails,&rdquo; you publish the current truth once and let customers
                    self-serve the details whenever they need them.
                  </p>
                </Callout>
              </Section>

              <Section id="messages-activity" title="Messages & activity timeline" eyebrow="Shared narrative">
                <p>Containerly keeps communication attached to the shipment record:</p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Messages</strong> capture questions and answers without losing context.
                  </li>
                  <li>
                    <strong>Activity events</strong> track key workflow moments — invites, access requests, approvals,
                    document actions, and tracking updates.
                  </li>
                  <li>
                    The timeline stays <strong>searchable and auditable</strong> for internal teams and customers.
                  </li>
                </ul>
                <Callout title="Replace inbox archaeology">
                  <p>
                    When someone asks &ldquo;why did we decide that?&rdquo; you can point to the shipment&apos;s
                    activity and messages, not an internal email chain that the customer can&apos;t see.
                  </p>
                </Callout>
              </Section>

              <Section id="tracking-alerts" title="Tracking & notifications" eyebrow="Stay ahead of exceptions">
                <p>
                  Once tracking identifiers are available, Containerly can sync milestones into the shipment timeline.
                </p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Track containers</strong> and store milestone history on the shipment record.
                  </li>
                  <li>
                    <strong>Surface changes</strong> as timeline updates rather than ad hoc screenshots.
                  </li>
                  <li>
                    <strong>Control carrier visibility</strong> per customer — carrier timeline, alerts, and vessel data
                    can be toggled independently in grant settings.
                  </li>
                  <li>
                    Operators can set a <strong>risk level</strong> on a shipment; when alerts are enabled for a
                    customer, they see the risk badge on their portal view.
                  </li>
                  <li>
                    <strong>Notify subscribers</strong> so the right people see exceptions early and return to the
                    portal.
                  </li>
                </ul>
                <Callout title="Notification philosophy">
                  <p>
                    Alerts should point back to the portal record, so every update has context and evidence — not a
                    detached &ldquo;FYI&rdquo; that starts a new thread.
                  </p>
                </Callout>
              </Section>

              <Section id="permissions" title="Permissions model" eyebrow="Governance">
                <p>Access is intentionally separated into two layers:</p>
                <ul className="list-disc pl-5">
                  <li>
                    <strong>Internal access</strong> via organization membership. Admins manage settings, branding, and
                    team invites; members collaborate on shipments.
                  </li>
                  <li>
                    <strong>External access</strong> via customer shipment grants — scoped to specific shipments with
                    per-customer visibility (see Sharing &amp; access controls).
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
                  {HOW_IT_WORKS_GLOSSARY.map((row) => (
                    <DefinitionRow key={row.k} k={row.k} v={row.v} />
                  ))}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </main>
    <MarketingFooter />
    </>
  );
}
