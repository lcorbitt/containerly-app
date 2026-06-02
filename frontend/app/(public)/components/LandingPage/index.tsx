import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Lock, ShieldCheck, Zap } from "lucide-react";
import { AudienceSection } from "./components/AudienceSection";
import { BeforeAfter } from "./components/BeforeAfter";
import { PortalMockup } from "./components/PortalMockup";
import {
  ACCENT_BTN_CLASS,
  GHOST_BTN_CLASS,
  HERO_EYEBROW,
  HERO_SUBHEAD,
  automationExamples,
  featureCards,
  painBullets,
  portalSteps,
  steps,
} from "./constants";

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-20 pt-10 md:px-8 md:pb-28 md:pt-16">
        <div className="landing-grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-hero-glow" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-orange to-transparent opacity-50"
          aria-hidden
        />

        <Reveal whenInView className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <div className="text-center lg:text-left">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
              {HERO_EYEBROW}
            </p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-5xl md:leading-[1.1] lg:text-5xl">
              Stop managing shipment communication manually.{" "}
              <span className="text-primary-orange">Send one link instead.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg lg:mx-0">
              {HERO_SUBHEAD}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/login" className={ACCENT_BTN_CLASS}>
                Start Free
              </Link>
              <Link href="/how-it-works" className={GHOST_BTN_CLASS}>
                See how it works
              </Link>
            </div>
          </div>

          <div className="relative">
            <PortalMockup />
          </div>
        </Reveal>
      </section>

      <section
        id="before-after"
        className="scroll-mt-20 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              One link replaces the whole thread
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              This is what changes the day you send a portal instead of another status reply.
            </p>
          </div>
          <div className="mt-12">
            <BeforeAfter />
          </div>
        </Reveal>
      </section>

      <section
        id="problem"
        className="scroll-mt-20 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Fragmented information creates expensive conversations
            </h2>
            <p className="mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
              When customers cannot self serve, every update becomes a one off reply. Containerly gives
              operators a professional surface to publish clarity and gives customers a reason to stop
              opening new threads.
            </p>
          </div>
          <ul className="mt-10 grid gap-3 md:grid-cols-2">
            {painBullets.map((text) => (
              <li
                key={text}
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3.5 text-sm text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-300"
              >
                {text}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section
        id="audience"
        className="scroll-mt-20 border-t border-zinc-200 bg-zinc-100 px-4 py-20 dark:border-white/[0.06] dark:bg-black/40 md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Built for the people who answer for the shipment
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Same product, three lenses. Find the version of the pain that sounds like your week.
            </p>
          </div>
          <div className="mt-12">
            <AudienceSection />
          </div>
        </Reveal>
      </section>

      <section
        id="features"
        className="scroll-mt-20 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Everything that lives on the link
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Run export documentation and customer portal programs with a lot less noise.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-100 to-transparent p-6 transition-[border-color,box-shadow] hover:border-primary-orange/35 hover:shadow-[0_0_40px_-8px_rgba(255,78,0,0.25)] dark:border-white/[0.08] dark:from-white/[0.04]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-primary-orange/30 bg-primary-orange/10 text-primary-orange">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section
        id="customer-portal"
        className="scroll-mt-20 border-t border-zinc-200 bg-zinc-100 px-4 py-20 dark:border-white/[0.06] dark:bg-black/40 md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Give customers an experience your competitors can&apos;t
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              While other partners still email status updates and PDF drafts, you hand customers a
              branded portal anchored to every shipment. It is the difference between being the
              supplier they tolerate and the one they do not want to replace.
            </p>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2">
            {portalSteps.map(({ n, title, body }) => (
              <li
                key={n}
                className="relative rounded-2xl border border-zinc-200 p-6 pl-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-primary-orange before:shadow-[0_0_16px_rgba(255,78,0,0.5)] dark:border-white/[0.08]"
              >
                <span className="font-mono text-xs text-primary-orange">{n}</span>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section
        id="automation"
        className="scroll-mt-20 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
                Automation tuned to your operating model
              </h2>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Decide which events matter, then let Containerly route the signal to subscribers and
                internal owners without another manual distribution list.
              </p>
            </div>
            <Link href="/login" className={`${GHOST_BTN_CLASS} hidden md:inline-flex`}>
              Open the app
            </Link>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {automationExamples.map(({ title, body }) => (
              <article
                key={title}
                className="rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-100 to-transparent p-6 dark:border-white/[0.08] dark:from-white/[0.03]"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-primary-orange/25 bg-primary-orange/10 text-primary-orange">
                  <Zap className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-zinc-200 bg-zinc-100 px-4 py-20 dark:border-white/[0.06] dark:bg-black/40 md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">How it works</h2>
              <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
                Build the shipment workspace your team trusts, then publish that same clarity to
                customers through a branded portal with document approvals, messaging, and live
                milestones.
              </p>
            </div>
            <Link href="/login" className={`${GHOST_BTN_CLASS} hidden md:inline-flex`}>
              Open the app
            </Link>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {steps.map(({ n, title, body }) => (
              <li
                key={n}
                className="relative rounded-2xl border border-zinc-200 p-6 pl-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-primary-orange before:shadow-[0_0_16px_rgba(255,78,0,0.5)] dark:border-white/[0.08]"
              >
                <span className="font-mono text-xs text-primary-orange">{n}</span>
                <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      <section
        id="team"
        className="scroll-mt-20 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-6xl">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              One workspace for everyone who owns the answer
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Operations, planning, and leadership stay aligned on the same shipments. Add seats and
              company level billing as you move from pilot teams to full departments.
            </p>
          </div>
        </Reveal>
      </section>

      <section
        id="security"
        className="scroll-mt-20 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-white/10 dark:text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-orange" aria-hidden />
              Trust and control
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Your program data stays under your governance
            </h2>
            <p className="mt-3 text-zinc-600 dark:text-zinc-400">
              Permissions follow your organization. Published customer views include only the shipments
              and artifacts you choose to expose, with nothing beyond that boundary.
            </p>
          </div>
          <div className="flex flex-1 flex-wrap justify-center gap-4 md:justify-end">
            <div className="flex h-28 w-40 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400">
              <Lock className="h-8 w-8 text-primary-orange/80" strokeWidth={1.5} aria-hidden />
              <span className="font-medium text-zinc-600 dark:text-zinc-300">Company scoped access</span>
            </div>
            <div className="flex h-28 w-40 flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-600 dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-zinc-400">
              <ShieldCheck className="h-8 w-8 text-primary-orange/80" strokeWidth={1.5} aria-hidden />
              <span className="font-medium text-zinc-600 dark:text-zinc-300">Publish deliberately</span>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8">
        <Reveal whenInView className="mx-auto max-w-4xl rounded-3xl border border-primary-orange/25 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent px-8 py-14 text-center md:px-16">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
            Become the partner your customers do not want to replace
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
            Create commercial shipments, route export documents for customer approval, and open a
            branded portal that makes every competitor still emailing PDFs look behind. Add premium
            carrier tracking once documents are signed off and numbers are published.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className={ACCENT_BTN_CLASS}>
              Start Free
            </Link>
            <Link href="/login" className={GHOST_BTN_CLASS}>
              Sign In
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-zinc-200 px-4 py-10 dark:border-white/[0.06] md:px-8">
        <Reveal whenInView className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p>{`\u00A9 ${new Date().getFullYear()} Containerly`}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/#before-after" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Why
            </Link>
            <Link href="/#audience" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Who it is for
            </Link>
            <Link href="/#features" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Product
            </Link>
            <Link href="/#customer-portal" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              Portal
            </Link>
            <Link href="/login" className="transition-colors hover:text-zinc-600 dark:text-zinc-300">
              App
            </Link>
          </div>
        </Reveal>
      </footer>
    </>
  );
}
