import type { Metadata } from "next";
import { PublicTopNav } from "@/components/TopNav";
import { SITE_DESCRIPTION, SITE_LANDING_TITLE, SITE_LOGO_PATH } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: SITE_LANDING_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_LANDING_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_PATH],
  },
  twitter: {
    title: SITE_LANDING_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_LOGO_PATH],
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="public-shell flex min-h-0 flex-1 flex-col">
      <PublicTopNav />
      <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
