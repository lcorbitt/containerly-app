import type { Metadata } from "next";

export const SITE_NAME = "Containerly";

/** Full-resolution brand mark (OG, favicon, share cards). */
export const SITE_LOGO_PATH = "/containerly-logo.png";
export const SITE_LOGO_WIDTH = 1152;
export const SITE_LOGO_HEIGHT = 928;

/** Small nav-optimized PNG in `public/` (also bundled via static import in NavBrand). */
export const SITE_NAV_LOGO_PATH = "/containerly-logo-nav.png";

export const SITE_DESCRIPTION =
  "Real-time shipment status and carrier updates in one place—so logistics teams spend less time searching and more time managing.";

export const SITE_TITLE = "Containerly — Real-time shipment visibility";

export const SITE_LANDING_TITLE = "Containerly — Track every shipment in one place";

/** Public site origin for links (no trailing slash). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ||
  "http://localhost:3000";

export function siteMetadataBase(): URL {
  return new URL(`${SITE_URL}/`);
}

const openGraphImages: NonNullable<Metadata["openGraph"]>["images"] = [
  {
    url: SITE_LOGO_PATH,
    width: SITE_LOGO_WIDTH,
    height: SITE_LOGO_HEIGHT,
    alt: `${SITE_NAME} logo`,
  },
];

/** Default metadata for the whole app (OG/Twitter share previews, favicon, title template). */
export const rootSiteMetadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: openGraphImages,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_PATH],
  },
  icons: {
    icon: [
      { url: SITE_NAV_LOGO_PATH, sizes: "32x32", type: "image/png" },
      { url: SITE_LOGO_PATH, sizes: "1152x928", type: "image/png" },
    ],
    apple: SITE_NAV_LOGO_PATH,
  },
};
