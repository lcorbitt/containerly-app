import { SITE_NAV_TAGLINE } from "@/lib/site-metadata";
import { NAV_BRAND_TAGLINE_APP_CLASS, NAV_BRAND_TAGLINE_MARKETING_CLASS } from "./constants";

export function NavBrandTagline({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  return (
    <p
      className={variant === "marketing" ? NAV_BRAND_TAGLINE_MARKETING_CLASS : NAV_BRAND_TAGLINE_APP_CLASS}
    >
      {SITE_NAV_TAGLINE}
    </p>
  );
}
