import Link from "next/link";
import { Eye } from "lucide-react";

const linkClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900";

export function ShipmentCustomerPortalLink({
  shipmentId,
  className,
}: {
  shipmentId: string;
  className?: string;
}) {
  return (
    <Link
      href={`/shipments/${shipmentId}/customer-portal`}
      className={`${linkClass} ${className ?? ""}`.trim()}
    >
      <Eye className="h-4 w-4 opacity-70" aria-hidden />
      Customer Portal
    </Link>
  );
}
