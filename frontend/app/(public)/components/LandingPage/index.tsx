import Link from "next/link";
import {
  Bell,
  GitBranch,
  Lock,
  Radar,
  ShieldCheck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const accentBtn =
  "inline-flex items-center justify-center rounded-full border border-primary-orange/70 bg-white px-6 py-3 text-sm font-semibold text-primary-orange shadow-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/5 active:scale-[0.98] dark:border-primary-orange/85 dark:bg-black/55 dark:shadow-[0_0_28px_rgba(255,78,0,0.35)] dark:backdrop-blur-sm dark:hover:bg-primary-orange/10 dark:hover:shadow-[0_0_40px_rgba(255,78,0,0.48)]";

const ghostBtn =
  "inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-orange/40 hover:text-zinc-900 dark:border-white/15 dark:text-zinc-200 dark:hover:text-white";

const featureCards = [
  {
    icon: Radar,
    title: "One operational view",
    body: "Status, milestones, and history in one workspace so your team is not reconciling three different answers.",
  },
  {
    icon: Bell,
    title: "Branded portals for customers",
    body: "Importers and partners see the same narrative you do. Optional alerts bring them back to the portal when something material changes.",
  },
  {
    icon: Workflow,
    title: "Automation behind the scenes",
    body: "Route delays and exceptions to the right owners so issues are handled before they become escalations.",
  },
  {
    icon: GitBranch,
    title: "Retail grade clarity",
    body: "Clear next steps and ETAs that feel closer to consumer tracking than a forwarded thread from a broker.",
  },
  {
    icon: Users,
    title: "Built for how teams work",
    body: "Shared access and history so operations, planning, and leadership reference the same shipments and decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Document approval workflow",
    body: "Upload export drafts, route them for customer sign-off, and track originals through mail and carrier milestones.",
  },
] as const;

const painBullets = [
  "Status lives in inboxes, spreadsheets, and carrier sites at the same time.",
  "Customers reopen the same questions by email and phone because they lack a durable place to look.",
  "Handoffs between modes and partners leave gaps nobody owns.",
  "Exceptions surface late because nobody is notified with context.",
] as const;

const portalSteps = [
  {
    n: "01",
    title: "Extend your workspace",
    body: "Share a branded portal so customers review documents, approve exports, and follow activity — with optional carrier tracking when you enable it.",
  },
  {
    n: "02",
    title: "Low friction onboarding",
    body: "Customers complete a short, verified sign up so you maintain accountability without a heavyweight IT project.",
  },
  {
    n: "03",
    title: "One narrative",
    body: "They return to the same timeline your operators trust instead of piecing together screenshots and forwards.",
  },
  {
    n: "04",
    title: "Stay aligned when it moves",
              body: "Configure notifications that point back to the portal so updates stay tied to evidence instead of ad hoc messages.",
  },
] as const;

const automationExamples = [
  {
    title: "Act on delays",
    body: "Notify subscribers and internal owners the moment a milestone slips.",
  },
  {
    title: "Surface stale data",
    body: "Flag your team when information needs a refresh before it becomes a customer issue.",
  },
  {
    title: "Meet people where they are",
    body: "Email and SMS today with room to expand into the channels your organization standardizes on.",
  },
] as const;

const steps = [
  {
    n: "01",
    title: "Set up your organization",
    body: "Create your organization and invite teammates so operations, planning, and leadership work from one shared source of truth.",
  },
  {
    n: "02",
    title: "Create a shipment workspace",
    body: "Start with commercial details and order lines. Keep every update anchored to a single shipment record instead of scattered threads and spreadsheets.",
  },
  {
    n: "03",
    title: "Upload documents and collect approval",
    body: "Route export drafts and key attachments for customer sign-off. Approvals, rejections, and comments stay attached to the shipment timeline.",
  },
  {
    n: "04",
    title: "Invite customers into a branded portal",
    body: "Share a dedicated customer portal where importers and partners can self-serve documents, shipment details, and the same narrative your team relies on.",
  },
  {
    n: "05",
    title: "Keep communication structured",
    body: "Use portal messaging and activity history so updates stay tied to evidence, decisions, and accountability — not forwarded screenshots.",
  },
  {
    n: "06",
    title: "Track progress and notify the right people",
    body: "Add container tracking as identifiers become available, monitor milestones, and configure notifications so exceptions surface early and subscribers return to the portal.",
  },
] as const;

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-10 md:px-8 md:pb-28 md:pt-14">
        <div className="landing-grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-hero-glow" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-orange to-transparent opacity-50"
          aria-hidden
        />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
            Operator-to-importer shipment intelligence
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-6xl md:leading-[1.08]">
            One credible view of every shipment for{" "}
            <span className="text-primary-orange">your team and your customers</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
            Containerly is the logistics customer portal that pairs export documentation workflows with optional live
            container tracking, so status inquiries route to a single source instead of email threads and phone tags.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className={accentBtn}>
              Start for free
            </Link>
            <Link href="/how-it-works" className={ghostBtn}>
              See how it works
            </Link>
          </div>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 text-left md:grid-cols-4 md:gap-8">
            {[
              { k: "Operations", v: "Unified timeline" },
              { k: "Customers", v: "Dedicated portal" },
              { k: "Teams", v: "Shared workspace" },
              { k: "Scale", v: "Automated signals" },
            ].map(({ k, v }) => (
              <div
                key={k}
                className="rounded-xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] px-4 py-3 backdrop-blur-sm"
              >
                <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="problem" className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Fragmented information creates expensive conversations.
            </h2>
            <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
              When customers cannot self serve, every update becomes a bespoke reply. Containerly gives operators a
              professional surface to publish clarity and gives customers a reason to stop opening new threads.
            </p>
          </div>
          <ul className="mt-10 grid gap-3 md:grid-cols-2">
            {painBullets.map((text) => (
              <li
                key={text}
                className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] px-5 py-3.5 text-sm text-zinc-600 dark:text-zinc-300"
              >
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">Platform capabilities</h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Everything you need to run export documentation and customer portal programs with less noise.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-gradient-to-b from-zinc-100 dark:from-white/[0.04] to-transparent p-6 transition-[border-color,box-shadow] hover:border-primary-orange/35 hover:shadow-[0_0_40px_-8px_rgba(255,78,0,0.25)]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-primary-orange/30 bg-primary-orange/10 text-primary-orange">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="customer-portal"
        className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-black/40 px-4 py-20 md:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              The customer portal your program deserves
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Present importers and partners with the same depth you rely on internally. The experience stays accurate,
              searchable, and anchored to each shipment so communication stays structured instead of improvised.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {portalSteps.map(({ n, title, body }) => (
              <li
                key={n}
                className="relative rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-6 pl-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-primary-orange before:shadow-[0_0_16px_rgba(255,78,0,0.5)]"
              >
                <span className="font-mono text-xs text-primary-orange">{n}</span>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="automation" className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
                Automation tuned to your operating model
              </h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Decide which events matter, then let Containerly route the signal to subscribers and internal owners
                without another manual distribution list.
              </p>
            </div>
            <Link href="/login" className={`${ghostBtn} hidden md:inline-flex`}>
              Open the app
            </Link>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {automationExamples.map(({ title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-gradient-to-b from-zinc-100 dark:from-white/[0.03] to-transparent p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-primary-orange/25 bg-primary-orange/10 text-primary-orange">
                  <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-100 dark:bg-black/40 px-4 py-20 md:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">How it works</h2>
              <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
                Build the shipment workspace your team trusts, then publish that same clarity to customers through a
                branded portal with document approvals, messaging, and live milestones.
              </p>
            </div>
            <Link href="/login" className={`${ghostBtn} hidden md:inline-flex`}>
              Open the app
            </Link>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ n, title, body }) => (
              <li
                key={n}
                className="relative rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-6 pl-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-primary-orange before:shadow-[0_0_16px_rgba(255,78,0,0.5)]"
              >
                <span className="font-mono text-xs text-primary-orange">{n}</span>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="team" className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              One workspace for everyone who owns the answer
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Operations, planning, and leadership stay aligned on the same shipments. Add seats and company level
              billing as you move from pilot teams to full departments.
            </p>
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-20 border-t border-zinc-200 dark:border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-white/10 px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-orange" aria-hidden />
              Trust and control
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Your program data stays under your governance
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Permissions follow your organization. Published customer views include only the shipments and artifacts you
              choose to expose, with nothing beyond that boundary.
            </p>
          </div>
          <div className="flex flex-1 flex-wrap justify-center gap-4 md:justify-end">
            <div className="flex h-28 w-40 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] text-center text-xs text-zinc-600 dark:text-zinc-400">
              <Lock className="h-8 w-8 text-primary-orange/80" strokeWidth={1.5} aria-hidden />
              <span className="font-medium text-zinc-600 dark:text-zinc-300">Company scoped access</span>
            </div>
            <div className="flex h-28 w-40 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 dark:border-white/[0.08] bg-zinc-50 dark:bg-white/[0.02] text-center text-xs text-zinc-600 dark:text-zinc-400">
              <ShieldCheck className="h-8 w-8 text-primary-orange/80" strokeWidth={1.5} aria-hidden />
              <span className="font-medium text-zinc-600 dark:text-zinc-300">Publish deliberately</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-primary-orange/25 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent px-8 py-14 text-center md:px-16">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
            Launch your documentation portal first
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
            Create commercial shipments, route export documents for customer approval, and open a branded portal. Add
            premium carrier tracking only when documents are signed off and numbers are published.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className={accentBtn}>
              Get started
            </Link>
            <Link href="/login" className={ghostBtn}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-white/[0.06] px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p>© {new Date().getFullYear()} Containerly</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/#problem" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Challenge
            </Link>
            <Link href="/#features" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Product
            </Link>
            <Link href="/#customer-portal" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Portal
            </Link>
            <Link href="/#automation" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Automation
            </Link>
            <Link href="/login" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              App
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
