import type { Metadata } from "next";

export const SITE_NAME = "Containerly";

export const SITE_LOGO_PATH = "/containerly-logo.png";
export const SITE_LOGO_WIDTH = 1152;
export const SITE_LOGO_HEIGHT = 928;

export const SITE_DESCRIPTION =
  "Real-time shipment status and carrier updates in one place—so logistics teams spend less time searching and more time managing.";

export const SITE_TITLE = "Containerly — Real-time shipment visibility";

export const SITE_LANDING_TITLE = "Containerly — Track every shipment in one place";

export function siteMetadataBase(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return new URL(raw.endsWith("/") ? raw : `${raw}/`);
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
    icon: SITE_LOGO_PATH,
    apple: SITE_LOGO_PATH,
  },
};
