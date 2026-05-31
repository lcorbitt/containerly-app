import type { Metadata } from "next";
import { PublicTopNav } from "@/components/TopNav";

export const metadata: Metadata = {
  title: "Containerly — Customer portal for logistics teams",
  description:
    "Export documentation workflows and branded customer portals for logistics operators. Optional live carrier tracking when you need it.",
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
