import { PortalTopNav } from "@/components/TopNav";

/** Auth-gated shipment portal — no operator shell, no marketing nav. */
export default function PortalLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="portal-shell flex min-h-0 flex-1 flex-col">
      <PortalTopNav />
      <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
