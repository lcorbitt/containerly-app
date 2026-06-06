export interface MarketingFooterLink {
  href: string;
  label: string;
}

export interface MarketingFooterLinkGroup {
  title: string;
  links: readonly MarketingFooterLink[];
}
