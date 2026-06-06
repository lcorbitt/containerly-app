"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import {
  ACCENT_BTN_CLASS,
  ANNUAL_DISCOUNT_LABEL,
  BILLING_CYCLE_OPTIONS,
  BILLING_TOGGLE_ACTIVE_CLASS,
  BILLING_TOGGLE_INACTIVE_CLASS,
  BILLING_TOGGLE_OPTION_CLASS,
  BILLING_TOGGLE_WRAP_CLASS,
  GHOST_BTN_CLASS,
  LOGIN_HREF,
  PRICING_EYEBROW,
  PRICING_HEADLINE,
  PRICING_SUBHEAD,
  SALES_EMAIL_HREF,
  TIER_CARD_BASE_CLASS,
  TIER_CARD_DEFAULT_CLASS,
  TIER_CARD_HIGHLIGHTED_CLASS,
  TIER_CTA_PRIMARY_CLASS,
  TIER_CTA_SECONDARY_CLASS,
  faqItems,
  featureGroups,
  pricingTiers,
  trustBadges,
} from "./constants";
import { getAnnualSavingsPercent, getDisplayPrice } from "./utils";
import { usePricingPage } from "./usePricingPage";

export function PricingPage() {
  const { billingCycle, setBillingCycle } = usePricingPage();

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:px-8 md:pb-20 md:pt-16">
        <div className="landing-grid-bg pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-hero-glow" aria-hidden />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-orange to-transparent opacity-50"
          aria-hidden
        />

        <Reveal whenInView className="relative mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
            {PRICING_EYEBROW}
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-5xl md:leading-[1.1]">
            {PRICING_HEADLINE}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-lg">
            {PRICING_SUBHEAD}
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <div className={BILLING_TOGGLE_WRAP_CLASS} role="tablist" aria-label="Billing cycle">
              {BILLING_CYCLE_OPTIONS.map(({ id, label }) => {
                const active = billingCycle === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setBillingCycle(id)}
                    className={`${BILLING_TOGGLE_OPTION_CLASS} ${active ? BILLING_TOGGLE_ACTIVE_CLASS : BILLING_TOGGLE_INACTIVE_CLASS}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span
              className={`text-xs font-medium text-primary-orange transition-opacity ${billingCycle === "annual" ? "opacity-100" : "opacity-0"}`}
              aria-hidden={billingCycle !== "annual"}
            >
              {ANNUAL_DISCOUNT_LABEL} with annual billing
            </span>
          </div>
        </Reveal>
      </section>

      <section className="px-4 pb-20 md:px-8">
        <Reveal whenInView className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {pricingTiers.map((tier) => {
            const { amount, isNumeric } = getDisplayPrice(tier, billingCycle);
            const savings = getAnnualSavingsPercent(tier);
            const Icon = tier.icon;
            const ctaClass =
              tier.id === "growth" ? TIER_CTA_PRIMARY_CLASS : TIER_CTA_SECONDARY_CLASS;

            return (
              <article
                key={tier.id}
                className={`${TIER_CARD_BASE_CLASS} ${tier.highlighted ? TIER_CARD_HIGHLIGHTED_CLASS : TIER_CARD_DEFAULT_CLASS}`}
              >
                {tier.badge ? (
                  <span className="absolute right-6 top-6 rounded-full bg-primary-orange/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-orange ring-1 ring-inset ring-primary-orange/30">
                    {tier.badge}
                  </span>
                ) : null}

                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-primary-orange/30 bg-primary-orange/10 text-primary-orange">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>

                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{tier.name}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {tier.tagline}
                </p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                    {amount}
                  </span>
                  <span className="pb-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {tier.priceUnit}
                  </span>
                </div>
                <p className="mt-1 h-4 text-xs font-medium text-primary-orange">
                  {isNumeric && billingCycle === "annual" && savings
                    ? `Save ${savings}% vs. monthly`
                    : ""}
                </p>

                <Link href={tier.ctaHref} className={ctaClass}>
                  {tier.ctaLabel}
                </Link>

                <ul className="mt-8 space-y-3 border-t border-zinc-200 pt-6 dark:border-white/[0.08]">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary-orange"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </Reveal>

        <Reveal
          whenInView
          className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400"
        >
          {trustBadges.map((badge) => (
            <span key={badge} className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-primary-orange" strokeWidth={2.25} aria-hidden />
              {badge}
            </span>
          ))}
        </Reveal>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-100 px-4 py-20 dark:border-white/[0.06] dark:bg-black/40 md:px-8">
        <Reveal whenInView className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
              Compare plans
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Everything you get, side by side
            </h2>
          </div>

          <div className="mt-12 space-y-10">
            {featureGroups.map((group) => (
              <div key={group.category}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {group.category}
                </h3>
                <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/[0.08] dark:bg-white/[0.02]">
                  <div className="hidden grid-cols-[1.6fr_repeat(3,1fr)] gap-2 border-b border-zinc-200 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-white/[0.08] dark:text-zinc-400 sm:grid">
                    <span>Feature</span>
                    {pricingTiers.map((tier) => (
                      <span key={tier.id} className="text-center">
                        {tier.name}
                      </span>
                    ))}
                  </div>
                  {group.rows.map((row, rowIndex) => (
                    <div
                      key={row.label}
                      className={`grid grid-cols-[1.6fr_repeat(3,1fr)] items-center gap-2 px-5 py-4 text-sm ${rowIndex > 0 ? "border-t border-zinc-200 dark:border-white/[0.06]" : ""}`}
                    >
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {row.label}
                      </span>
                      {pricingTiers.map((tier) => {
                        const value = row.values[tier.id];
                        return (
                          <div key={tier.id} className="flex justify-center text-center">
                            {typeof value === "string" ? (
                              <span className="text-zinc-700 dark:text-zinc-300">{value}</span>
                            ) : value ? (
                              <Check
                                className="h-4 w-4 text-primary-orange"
                                strokeWidth={2.5}
                                aria-label="Included"
                              />
                            ) : (
                              <Minus
                                className="h-4 w-4 text-zinc-300 dark:text-zinc-600"
                                aria-label="Not included"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section
        id="faq"
        className="scroll-mt-24 border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8"
      >
        <Reveal whenInView className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary-orange">
              FAQ
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
              Questions, answered
            </h2>
          </div>

          <div className="mt-10 space-y-4">
            {faqItems.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/[0.08] dark:bg-white/[0.02]"
              >
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="border-t border-zinc-200 px-4 py-20 dark:border-white/[0.06] md:px-8">
        <Reveal
          whenInView
          className="mx-auto max-w-4xl rounded-3xl border border-primary-orange/25 bg-gradient-to-br from-primary-orange/10 via-transparent to-transparent px-8 py-14 text-center md:px-16"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white md:text-3xl">
            Start free, then grow into every shipment
          </h2>
          <p className="mx-auto mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
            Spin up your first branded portal today and invite teammates in minutes. Upgrade when you
            are ready to put every shipment behind one link.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={LOGIN_HREF} className={ACCENT_BTN_CLASS}>
              Start Free
            </Link>
            <Link href={SALES_EMAIL_HREF} className={GHOST_BTN_CLASS}>
              Talk to sales
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
