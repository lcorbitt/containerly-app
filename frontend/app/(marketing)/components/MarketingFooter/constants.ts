import type { MarketingFooterLink, MarketingFooterLinkGroup } from "./types";

export const MARKETING_FOOTER_CONTACT_HREF =
  "mailto:sales@containerly.com?subject=Containerly%20inquiry";

export const MARKETING_FOOTER_TAGLINE = "Built for freight teams on 🌍";

export const MARKETING_FOOTER_LINK_GROUPS: readonly MarketingFooterLinkGroup[] = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#customer-portal", label: "Customer portal" },
      { href: "/pricing", label: "Pricing" },
      { href: "/#automation", label: "Automation" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/#how-it-works", label: "Getting started" },
      { href: "/#security", label: "Security" },
      { href: "/pricing#faq", label: "FAQs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#before-after", label: "Why Containerly" },
      { href: "/#audience", label: "Who it is for" },
      { href: MARKETING_FOOTER_CONTACT_HREF, label: "Contact us" },
    ],
  },
  {
    title: "App",
    links: [
      { href: "/login", label: "Sign In" },
      { href: "/signup", label: "Get Started" },
    ],
  },
];

export const MARKETING_FOOTER_LEGAL_LINKS: readonly MarketingFooterLink[] = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
];

export const MARKETING_FOOTER_CLASS =
  "border-t border-zinc-200 bg-zinc-950 px-4 py-16 text-zinc-400 dark:border-white/[0.06] md:px-8";

export const MARKETING_FOOTER_INNER_CLASS = "mx-auto max-w-6xl";

export const MARKETING_FOOTER_GRID_CLASS =
  "grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(4,minmax(0,1fr))] lg:gap-8";

export const MARKETING_FOOTER_BRAND_NAME_CLASS =
  "text-xl font-bold tracking-tight text-white";

export const MARKETING_FOOTER_TAGLINE_CLASS = "mt-3 max-w-xs text-sm leading-relaxed text-zinc-500";

export const MARKETING_FOOTER_COLUMN_TITLE_CLASS =
  "text-xs font-semibold uppercase tracking-[0.18em] text-white";

export const MARKETING_FOOTER_LINK_CLASS =
  "text-sm text-zinc-400 transition-colors hover:text-white";

export const MARKETING_FOOTER_LINK_LIST_CLASS = "mt-4 space-y-3";

export const MARKETING_FOOTER_BOTTOM_CLASS =
  "mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/[0.08] pt-8 text-sm text-zinc-500";

export const MARKETING_FOOTER_LEGAL_LINK_CLASS =
  "transition-colors hover:text-zinc-300";

export const MARKETING_FOOTER_LOGO_CLASS = "h-10 w-auto shrink-0 select-none";
