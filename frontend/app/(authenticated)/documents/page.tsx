import { DocumentQueue } from "./components/DocumentQueue";

export const dynamic = "force-dynamic";

export default function DocumentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        Documents
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Cross-shipment document workflow queue — pending drafts, customer review, and originals
        stages in one place.
      </p>
      <div className="mt-8">
        <DocumentQueue />
      </div>
    </div>
  );
}
