import type { Metadata } from "next";
import Link from "next/link";
import { CUSTOMER_MY_SHIPMENTS_LABEL, CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH } from "@/components/TopNav/CustomerTopNav/constants";

export const metadata: Metadata = {
  title: "Report unavailable | Containerly",
};

/** Legacy public report URLs are disabled — importers use authenticated shipment access. */
export default function LegacyPublicReportPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">This link is no longer supported</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Shared reports now require signing in with the email your logistics partner invited. Then open
        your shipment from{" "}
        <Link href={CUSTOMER_TOP_NAV_MY_SHIPMENTS_PATH} className="font-medium underline">
          {CUSTOMER_MY_SHIPMENTS_LABEL}
        </Link>{" "}
        or the invite link they sent.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Sign in
      </Link>
    </div>
  );
}
