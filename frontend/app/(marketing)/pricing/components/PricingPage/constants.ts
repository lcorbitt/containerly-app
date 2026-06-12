import { Building2, Layers, Rocket } from "lucide-react";
import type { BillingCycle, FaqItem, FeatureGroup, PricingTier } from "./types";

export const PRICING_EYEBROW = "Pricing";

export const PRICING_HEADLINE = "One seat per teammate. Unlimited portals for customers.";

export const PRICING_SUBHEAD =
  "Start free, invite your team, and upgrade when you are ready to put every shipment behind a branded customer portal. No card required to begin.";

export const ANNUAL_DISCOUNT_LABEL = "Save ~20%";

export const SALES_EMAIL_HREF = "mailto:sales@containerly.com?subject=Containerly%20Enterprise";

export const LOGIN_HREF = "/login";

export const SIGNUP_HREF = "/signup";

export const BILLING_CYCLE_OPTIONS: readonly { id: BillingCycle; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual" },
];

export const pricingTiers: readonly PricingTier[] = [
  {
    id: "starter",
    name: "Starter",
    icon: Rocket,
    tagline: "For individual teams or small organizations running their first portals.",
    monthlyPrice: 0,
    annualPrice: 0,
    priceUnit: "forever",
    ctaLabel: "Start Free",
    ctaHref: SIGNUP_HREF,
    highlighted: false,
    features: [
      "Up to 3 teammates",
      "Up to 10 active shipments",
      "Branded customer portals",
      "Document uploads & approvals",
      "Email notifications",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    icon: Layers,
    tagline: "For brokers and 3PLs scaling customer communication.",
    monthlyPrice: 49,
    annualPrice: 39,
    priceUnit: "/ seat / mo",
    ctaLabel: "Start Free",
    ctaHref: SIGNUP_HREF,
    highlighted: true,
    badge: "Most popular",
    features: [
      "Everything in Starter",
      "Unlimited teammates & shipments",
      "Carrier & container tracking",
      "SMS + email notifications",
      "Automation rules for delays",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    tagline: "For organizations standardizing on one source of truth.",
    monthlyPrice: null,
    annualPrice: null,
    customPriceLabel: "Custom",
    priceUnit: "tailored to your org",
    ctaLabel: "Talk to sales",
    ctaHref: SALES_EMAIL_HREF,
    highlighted: false,
    features: [
      "Everything in Growth",
      "SSO & advanced governance",
      "Company-level billing",
      "Dedicated onboarding",
      "Custom data retention & SLA",
    ],
  },
];

export const featureGroups: readonly FeatureGroup[] = [
  {
    category: "Shipments & portals",
    rows: [
      {
        label: "Active shipments",
        values: { starter: "10", growth: "Unlimited", enterprise: "Unlimited" },
      },
      {
        label: "Teammates",
        values: { starter: "3", growth: "Unlimited", enterprise: "Unlimited" },
      },
      {
        label: "Branded customer portals",
        values: { starter: true, growth: true, enterprise: true },
      },
      {
        label: "Document approvals",
        values: { starter: true, growth: true, enterprise: true },
      },
    ],
  },
  {
    category: "Tracking & automation",
    rows: [
      {
        label: "Carrier & container tracking",
        values: { starter: false, growth: true, enterprise: true },
      },
      {
        label: "Automation rules",
        values: { starter: false, growth: true, enterprise: true },
      },
      {
        label: "SMS notifications",
        values: { starter: false, growth: true, enterprise: true },
      },
    ],
  },
  {
    category: "Security & support",
    rows: [
      {
        label: "SSO & advanced governance",
        values: { starter: false, growth: false, enterprise: true },
      },
      {
        label: "Company-level billing",
        values: { starter: false, growth: false, enterprise: true },
      },
      {
        label: "Support",
        values: { starter: "Community", growth: "Priority", enterprise: "Dedicated" },
      },
    ],
  },
];

export const trustBadges: readonly string[] = [
  "No credit card to start",
  "Cancel anytime",
  "Company-scoped access",
];

export const faqItems: readonly FaqItem[] = [
  {
    question: "Is there really a free plan?",
    answer:
      "Yes. Starter is free forever for up to 3 teammates and 10 active shipments, so you can run real portals before paying anything.",
  },
  {
    question: "How does seat-based pricing work?",
    answer:
      "Growth is billed per teammate who works in the app. Customers you invite into shipment portals are always free and never count as seats.",
  },
  {
    question: "What does annual billing save me?",
    answer:
      "Switching from monthly to annual lowers the per-seat price by roughly 20%, billed once per year instead of every month.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Anytime. Upgrade, downgrade, or add seats as your team grows, and changes prorate automatically against your current cycle.",
  },
];

export const ACCENT_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full border border-primary-orange/70 bg-white px-6 py-3 text-sm font-semibold text-primary-orange shadow-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/5 active:scale-[0.98] dark:border-primary-orange/85 dark:bg-black/55 dark:shadow-[0_0_28px_rgba(255,78,0,0.35)] dark:backdrop-blur-sm dark:hover:bg-primary-orange/10 dark:hover:shadow-[0_0_40px_rgba(255,78,0,0.48)]";

export const GHOST_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-orange/40 hover:text-zinc-900 dark:border-white/15 dark:text-zinc-200 dark:hover:text-white";

export const TIER_CARD_BASE_CLASS =
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-zinc-100 to-transparent p-6 transition-[border-color,box-shadow] dark:from-white/[0.04] md:p-8";

export const TIER_CARD_DEFAULT_CLASS =
  "border-zinc-200 hover:border-primary-orange/35 hover:shadow-[0_0_40px_-8px_rgba(255,78,0,0.25)] dark:border-white/[0.08]";

export const TIER_CARD_HIGHLIGHTED_CLASS =
  "border-primary-orange/40 shadow-[0_0_50px_-10px_rgba(255,78,0,0.35)] dark:border-primary-orange/50 dark:shadow-[0_0_60px_-12px_rgba(255,78,0,0.45)]";

export const TIER_CTA_PRIMARY_CLASS =
  "mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary-orange px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[box-shadow,transform,background-color] hover:bg-primary-orange/90 active:scale-[0.98] dark:shadow-[0_0_32px_rgba(255,78,0,0.4)]";

export const TIER_CTA_SECONDARY_CLASS = `${ACCENT_BTN_CLASS} mt-8 w-full`;

export const BILLING_TOGGLE_WRAP_CLASS =
  "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-black/40";

export const BILLING_TOGGLE_OPTION_CLASS =
  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors";

export const BILLING_TOGGLE_ACTIVE_CLASS = "bg-primary-orange text-white shadow-sm";

export const BILLING_TOGGLE_INACTIVE_CLASS =
  "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white";
