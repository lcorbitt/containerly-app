import Link from "next/link";
import { Box, Cpu, Radar, ShieldCheck, Zap } from "lucide-react";

const accentBtn =
  "inline-flex items-center justify-center rounded-full border border-primary-orange/85 bg-black/55 px-6 py-3 text-sm font-semibold text-primary-orange shadow-[0_0_28px_rgba(255,78,0,0.35)] backdrop-blur-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/10 hover:shadow-[0_0_40px_rgba(255,78,0,0.48)] active:scale-[0.98]";

const ghostBtn =
  "inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-primary-orange/40 hover:text-white";

const featureCards = [
  {
    icon: Radar,
    title: "Live container state",
    body: "Track requests and milestones in one place—no more spreadsheet archaeology.",
  },
  {
    icon: Cpu,
    title: "Edge-powered sync",
    body: "Serverless workers pull from carrier APIs, normalize events, and write through RLS-safe paths.",
  },
  {
    icon: Zap,
    title: "Alerts that matter",
    body: "Surface exceptions and stale data before they become customer-facing incidents.",
  },
] as const;

const steps = [
  { n: "01", title: "Connect your workspace", body: "Sign in, pick an organization, invite your team." },
  { n: "02", title: "Submit tracking requests", body: "Container numbers flow into the pipeline instantly." },
  { n: "03", title: "Watch the timeline update", body: "Cached state in Postgres keeps the UI fast and truthful." },
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
            Logistics OS
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[1.08]">
            Visibility across every{" "}
            <span className="text-primary-orange">
              container
            </span>
            , without the noise.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400 md:text-lg">
            Containerly is a Supabase-native control plane for multi-tenant tracking—Postgres RLS, Edge Functions,
            and a dashboard your ops team will actually open.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className={accentBtn}>
              Start for free
            </Link>
            <Link href="/#features" className={ghostBtn}>
              Explore product
            </Link>
          </div>
          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 text-left md:grid-cols-4 md:gap-8">
            {[
              { k: "Tenants", v: "Isolated by RLS" },
              { k: "Sync", v: "Edge Functions" },
              { k: "Data", v: "Cached in Postgres" },
              { k: "UI", v: "Fast dashboards" },
            ].map(({ k, v }) => (
              <div
                key={k}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 backdrop-blur-sm"
              >
                <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{k}</dt>
                <dd className="mt-1 text-sm font-medium text-zinc-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="features" className="scroll-mt-20 border-t border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Built for operators who ship freight, not slides.
            </h2>
            <p className="mt-3 text-zinc-400">
              Every surface is optimized for clarity—dark chrome, high contrast, and a single accent that guides the eye.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {featureCards.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 transition-[border-color,box-shadow] hover:border-primary-orange/35 hover:shadow-[0_0_40px_-8px_rgba(255,78,0,0.25)]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-primary-orange/30 bg-primary-orange/10 text-primary-orange">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-white/[0.06] bg-black/40 px-4 py-20 md:px-8"
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">How it works</h2>
              <p className="mt-2 max-w-xl text-zinc-400">
                From auth to org context to tracking requests—wired the way modern SaaS should be.
              </p>
            </div>
            <Link href="/login" className={`${ghostBtn} hidden md:inline-flex`}>
              Open the app
            </Link>
          </div>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(({ n, title, body }) => (
              <li
                key={n}
                className="relative rounded-2xl border border-white/[0.08] p-6 pl-8 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-2xl before:bg-primary-orange before:shadow-[0_0_16px_rgba(255,78,0,0.5)]"
              >
                <span className="font-mono text-xs text-primary-orange">{n}</span>
                <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-zinc-400">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="security" className="scroll-mt-20 border-t border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 text-primary-orange" aria-hidden />
              Security by default
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white md:text-3xl">
              Row-level security that matches your org graph.
            </h2>
            <p className="mt-3 text-zinc-400">
              Membership drives access; superadmins get platform views. Your customer data never bleeds across tenants.
            </p>
          </div>
          <div className="flex flex-1 flex-wrap justify-center gap-4 md:justify-end">
            <div className="flex h-28 w-40 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] font-mono text-xs text-zinc-500">
              <Box className="mb-2 h-8 w-8 text-primary-orange/80" strokeWidth={1.5} aria-hidden />
              Postgres + RLS
            </div>
            <div className="flex h-28 w-40 flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] font-mono text-xs text-zinc-500">
              <Cpu className="mb-2 h-8 w-8 text-primary-orange/80" strokeWidth={1.5} aria-hidden />
              Edge Functions
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-20 md:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-primary-orange/25 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent px-8 py-14 text-center md:px-16">
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            Ready to light up your supply chain?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-zinc-400">
            Sign in with email, create an organization, and start submitting tracking requests in minutes.
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

      <footer className="border-t border-white/[0.06] px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p>© {new Date().getFullYear()} Containerly</p>
          <div className="flex gap-6">
            <Link href="/#features" className="transition-colors hover:text-zinc-300">
              Features
            </Link>
            <Link href="/login" className="transition-colors hover:text-zinc-300">
              App
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
