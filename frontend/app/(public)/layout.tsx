import type { Metadata } from "next";
import { PublicTopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Containerly — Logistics visibility, engineered",
  description:
    "Multi-tenant container tracking with Postgres RLS, Edge Function sync, cached state, and alerts on exceptions.",
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="landing-root flex min-h-0 flex-1 flex-col">
      <PublicTopNav />
      <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
