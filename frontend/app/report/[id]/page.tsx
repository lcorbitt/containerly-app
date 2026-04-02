import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicContainerReport } from "@/components/public-container-report";
import { fetchPublicReport } from "@/lib/supabase/public-edge";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await fetchPublicReport(id);
  if (!r.ok) return { title: "Report | Containerly" };
  return {
    title: `${r.data.report.title ?? r.data.summary.container_number} | Containerly`,
    description: "Shared container visibility report",
  };
}

export default async function PublicReportPage({ params }: Props) {
  const { id } = await params;
  const r = await fetchPublicReport(id);

  if (!r.ok) {
    if (r.status === 404 || r.status === 400) notFound();
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Report unavailable</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{r.error}</p>
        <Link href="/" className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
          Back to home
        </Link>
      </div>
    );
  }

  return <PublicContainerReport reportId={id} initial={r.data} />;
}
